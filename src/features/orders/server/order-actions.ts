"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth/session";
import { auditData, messageUrl, optionalText } from "@/features/admin/server/shared";
import { sendOrderStatusEmail } from "@/features/email/server/deliver-order-email";
import { canTransitionOrder, type OrderStatus } from "@/features/orders/domain";
import { getPrismaClient } from "@/server/db/client";

const idSchema = z.string().trim().min(1).max(30);
const notesSchema = z.string().trim().max(20_000);
const trackingSchema = z.object({
  orderId: idSchema,
  trackingNumber: z.string().trim().max(191),
  trackingUrl: z.string().trim().max(2_048).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }),
});

function orderTarget(reference: string | number) {
  return `/admin/pedidos/${reference}`;
}

function submittedOrderTarget(formData: FormData, fallbackId: string) {
  const number = Number(formData.get("orderNumber"));
  return orderTarget(Number.isSafeInteger(number) && number > 0 ? number : fallbackId);
}

function refreshOrderViews(publicToken?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  if (publicToken) revalidatePath(`/pedido/${publicToken}`);
}

async function transitionOrder(orderId: string, targetStatus: OrderStatus) {
  const admin = await requireAdmin();
  const prisma = getPrismaClient();
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, number: true, publicToken: true, status: true },
    });
    if (!order || !canTransitionOrder(order.status, targetStatus)) {
      throw new Error("invalid-transition");
    }
    const now = new Date();
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: {
        status: targetStatus,
        ...(targetStatus === "DELIVERED" ? { deliveredAt: now } : {}),
        ...(targetStatus === "CANCELLED" ? { cancelledAt: now } : {}),
      },
    });
    if (updated.count !== 1) throw new Error("invalid-transition");
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: targetStatus,
        changedByAdminUserId: admin.id,
        source: "ADMIN",
      },
    });
    await tx.auditLog.create({
      data: auditData(admin.id, "ORDER_STATUS_CHANGED", "Order", order.id, {
        number: order.number,
        fromStatus: order.status,
        toStatus: targetStatus,
      }),
    });
    return order;
  });
}

async function transitionAction(formData: FormData, status: OrderStatus, success: string) {
  const parsed = idSchema.safeParse(formData.get("orderId"));
  if (!parsed.success) redirect(messageUrl("/admin/pedidos", "error", "Pedido no válido."));
  const target = submittedOrderTarget(formData, parsed.data);
  try {
    const order = await transitionOrder(parsed.data, status);
    const email = status === "CANCELLED" ? await sendOrderStatusEmail(order.id, "ORDER_CANCELLED_OR_REFUNDED") : null;
    refreshOrderViews(order.publicToken);
    const message = status === "CANCELLED"
      ? email?.status === "SENT"
        ? `${success} Se ha enviado el aviso al comprador.`
        : `${success} El correo no ha podido enviarse y queda pendiente de reintento.`
      : success;
    redirect(messageUrl(orderTarget(order.number), "ok", message));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(messageUrl(target, "error", "El estado del pedido ha cambiado. Actualiza la página y revisa la acción."));
  }
}

export async function markOrderInProduction(formData: FormData) {
  return transitionAction(formData, "IN_PRODUCTION", "Pedido marcado como en fabricación.");
}

export async function markOrderDelivered(formData: FormData) {
  return transitionAction(formData, "DELIVERED", "Pedido marcado como entregado.");
}

export async function cancelOrder(formData: FormData) {
  return transitionAction(formData, "CANCELLED", "Pedido cancelado. Recuerda que cualquier reembolso se realiza desde Stripe.");
}

export async function markOrderShipped(formData: FormData) {
  const parsed = trackingSchema.safeParse({
    orderId: formData.get("orderId"),
    trackingNumber: formData.get("trackingNumber"),
    trackingUrl: formData.get("trackingUrl"),
  });
  const fallbackId = String(formData.get("orderId") ?? "");
  const target = submittedOrderTarget(formData, fallbackId);
  if (!parsed.success) {
    redirect(messageUrl(target, "error", "Revisa el número y la URL de seguimiento."));
  }
  const admin = await requireAdmin();
  const prisma = getPrismaClient();
  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: parsed.data.orderId },
        select: { id: true, number: true, publicToken: true, status: true },
      });
      if (!current || !canTransitionOrder(current.status, "SHIPPED")) throw new Error("invalid-transition");
      const now = new Date();
      const updated = await tx.order.updateMany({
        where: { id: current.id, status: current.status },
        data: { status: "SHIPPED" },
      });
      if (updated.count !== 1) throw new Error("invalid-transition");
      const trackingNumber = parsed.data.trackingNumber || null;
      const trackingUrl = parsed.data.trackingUrl || null;
      await tx.shipment.upsert({
        where: { orderId: current.id },
        update: { trackingNumber, trackingUrl, shippedAt: now },
        create: { orderId: current.id, kind: "HOME", carrier: "SEUR", trackingNumber, trackingUrl, shippedAt: now },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: current.id, fromStatus: current.status, toStatus: "SHIPPED", changedByAdminUserId: admin.id, source: "ADMIN" },
      });
      await tx.auditLog.create({
        data: auditData(admin.id, "ORDER_SHIPPED", "Order", current.id, {
          number: current.number,
          hasTrackingNumber: Boolean(trackingNumber),
          hasTrackingUrl: Boolean(trackingUrl),
        }),
      });
      return current;
    });
    const email = await sendOrderStatusEmail(order.id, "ORDER_SHIPPED");
    refreshOrderViews(order.publicToken);
    redirect(messageUrl(
      orderTarget(order.number),
      "ok",
      email?.status === "SENT"
        ? "Pedido marcado como enviado y correo enviado al comprador."
        : "Pedido marcado como enviado. El correo no ha podido enviarse y queda pendiente de reintento.",
    ));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(messageUrl(target, "error", "No se ha podido marcar como enviado. Actualiza la página y revisa el estado."));
  }
}

export async function saveInternalNotes(formData: FormData) {
  const orderId = idSchema.safeParse(formData.get("orderId"));
  const notes = notesSchema.safeParse(formData.get("internalNotes"));
  const target = submittedOrderTarget(formData, String(formData.get("orderId") ?? ""));
  if (!orderId.success || !notes.success) {
    redirect(messageUrl(target, "error", "Las notas internas no son válidas."));
  }
  const admin = await requireAdmin();
  const prisma = getPrismaClient();
  try {
    const order = await prisma.$transaction(async (tx) => {
      const saved = await tx.order.update({
        where: { id: orderId.data },
        data: { internalNotes: optionalText(notes.data) },
        select: { id: true, number: true },
      });
      await tx.auditLog.create({
        data: auditData(admin.id, "ORDER_INTERNAL_NOTES_UPDATED", "Order", saved.id, {
          number: saved.number,
          hasNotes: Boolean(notes.data),
        }),
      });
      return saved;
    });
    refreshOrderViews();
    redirect(messageUrl(orderTarget(order.number), "ok", "Notas internas guardadas."));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(messageUrl(target, "error", "No se han podido guardar las notas internas."));
  }
}

export async function batchMarkInProduction(formData: FormData) {
  const ids = [...new Set(formData.getAll("orderIds").map(String))].slice(0, 200);
  const validIds = ids.filter((id) => idSchema.safeParse(id).success);
  if (validIds.length === 0) {
    redirect(messageUrl("/admin/pedidos", "error", "Selecciona al menos un pedido recibido."));
  }
  const admin = await requireAdmin();
  const prisma = getPrismaClient();
  const changed = await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({
      where: { id: { in: validIds }, status: "RECEIVED" },
      select: { id: true, number: true },
    });
    let changedCount = 0;
    for (const order of orders) {
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: "RECEIVED" },
        data: { status: "IN_PRODUCTION" },
      });
      if (updated.count !== 1) continue;
      changedCount += 1;
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, fromStatus: "RECEIVED", toStatus: "IN_PRODUCTION", changedByAdminUserId: admin.id, source: "ADMIN" },
      });
      await tx.auditLog.create({
        data: auditData(admin.id, "ORDER_BATCH_IN_PRODUCTION", "Order", order.id, { number: order.number }),
      });
    }
    return changedCount;
  });
  refreshOrderViews();
  redirect(messageUrl("/admin/pedidos", changed > 0 ? "ok" : "error", changed > 0 ? `${changed} pedido${changed === 1 ? "" : "s"} marcado${changed === 1 ? "" : "s"} como en fabricación.` : "Los pedidos seleccionados ya no estaban en estado recibido."));
}
