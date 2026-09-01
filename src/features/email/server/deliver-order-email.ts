import "server-only";

import type { EmailDeliveryStatus } from "@/generated/prisma/enums";
import { renderOrderEmail, type OrderEmailType } from "@/features/email/domain";
import { getMailTransporter } from "@/features/email/server/mailer";
import { getPrismaClient } from "@/server/db/client";

type DeliveryResult = {
  deliveryId: string;
  status: EmailDeliveryStatus;
  recipient: string;
  skipped: boolean;
};

function safeErrorSummary(error: unknown) {
  if (error instanceof Error && error.message === "smtp-not-configured") return "El correo saliente no está configurado.";
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code);
    if (code === "EAUTH") return "El servidor de correo ha rechazado las credenciales.";
    if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNREFUSED"].includes(code)) return "No se ha podido conectar con el servidor de correo.";
  }
  return "No se ha podido enviar el correo.";
}

async function loadEmailContext(orderId: string) {
  const prisma = getPrismaClient();
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: {
        address: true,
        shipment: { select: { trackingNumber: true, trackingUrl: true } },
        payment: { select: { status: true } },
        items: {
          orderBy: { createdAt: "asc" },
          select: {
            productNameSnapshot: true,
            sizeLabelSnapshot: true,
            quantity: true,
            lineTotalCents: true,
            customizations: { where: { orderItemComponentId: null }, orderBy: { sortOrder: "asc" }, select: { labelSnapshot: true, valueSnapshot: true } },
            components: { orderBy: { sortOrder: "asc" }, select: { componentLabelSnapshot: true, productNameSnapshot: true, sizeLabelSnapshot: true, quantitySnapshot: true, customizations: { orderBy: { sortOrder: "asc" }, select: { labelSnapshot: true, valueSnapshot: true } } } },
          },
        },
      },
    }),
    prisma.storeSettings.findUnique({ where: { id: 1 }, select: { storeName: true, supportEmail: true, deliveryEstimateText: true } }),
  ]);
  if (!order || !settings) throw new Error("email-context-not-found");
  return { order, settings };
}

async function getOrCreateDelivery(orderId: string, type: OrderEmailType, recipient: string) {
  const prisma = getPrismaClient();
  const where = { orderId_type_recipient: { orderId, type, recipient } } as const;
  const existing = await prisma.emailDelivery.findUnique({ where });
  if (existing) return { delivery: existing, created: false };
  try {
    const delivery = await prisma.emailDelivery.create({ data: { orderId, type, recipient } });
    return { delivery, created: true };
  } catch {
    const delivery = await prisma.emailDelivery.findUnique({ where });
    if (!delivery) throw new Error("email-delivery-create-failed");
    return { delivery, created: false };
  }
}

export async function deliverOrderEmail(orderId: string, type: OrderEmailType, options: { force?: boolean } = {}): Promise<DeliveryResult> {
  const { order, settings } = await loadEmailContext(orderId);
  const recipient = type === "ADMIN_NEW_ORDER" ? settings.supportEmail : order.email;
  const { delivery, created } = await getOrCreateDelivery(order.id, type, recipient);
  if (!created && !options.force) return { deliveryId: delivery.id, status: delivery.status, recipient, skipped: true };
  const prisma = getPrismaClient();
  const attemptedAt = new Date();
  await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: "PENDING", lastAttemptAt: attemptedAt, lastErrorSummary: null } });
  try {
    const { transporter, config, siteUrl } = getMailTransporter();
    const rendered = renderOrderEmail(type, order, settings, siteUrl);
    await transporter.sendMail({
      from: { name: config.fromName ?? settings.storeName, address: config.fromEmail },
      to: recipient,
      replyTo: settings.supportEmail,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
    const sent = await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: "SENT", attemptCount: { increment: 1 }, lastAttemptAt: attemptedAt, sentAt: new Date(), lastErrorSummary: null },
    });
    return { deliveryId: sent.id, status: sent.status, recipient, skipped: false };
  } catch (error) {
    const failed = await prisma.emailDelivery.update({
      where: { id: delivery.id },
      data: { status: "FAILED", attemptCount: { increment: 1 }, lastAttemptAt: attemptedAt, lastErrorSummary: safeErrorSummary(error) },
    });
    return { deliveryId: failed.id, status: failed.status, recipient, skipped: false };
  }
}

export async function sendOrderCreatedEmails(orderId: string) {
  for (const type of ["ORDER_RECEIVED", "ADMIN_NEW_ORDER"] as const) {
    try {
      await deliverOrderEmail(orderId, type);
    } catch {
      // El pedido ya está confirmado; un fallo de correo nunca lo revierte.
    }
  }
}

export async function sendOrderStatusEmail(orderId: string, type: "ORDER_SHIPPED" | "ORDER_CANCELLED_OR_REFUNDED") {
  try {
    return await deliverOrderEmail(orderId, type);
  } catch {
    return null;
  }
}
