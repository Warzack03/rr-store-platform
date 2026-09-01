"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth/session";
import { auditData, messageUrl } from "@/features/admin/server/shared";
import { deliverOrderEmail } from "@/features/email/server/deliver-order-email";
import { getPrismaClient } from "@/server/db/client";

const resendSchema = z.object({
  orderId: z.string().trim().min(1).max(30),
  orderNumber: z.coerce.number().int().positive(),
  type: z.enum(["ORDER_RECEIVED", "ORDER_SHIPPED", "ORDER_CANCELLED_OR_REFUNDED", "ADMIN_NEW_ORDER"]),
});

export async function resendOrderEmail(formData: FormData) {
  const parsed = resendSchema.safeParse({
    orderId: formData.get("orderId"),
    orderNumber: formData.get("orderNumber"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    redirect(messageUrl("/admin/pedidos", "error", "No se ha podido identificar el correo."));
  }

  const admin = await requireAdmin();
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { status: true, payment: { select: { status: true } } },
  });
  const applicable = order && (
    parsed.data.type === "ORDER_RECEIVED" ||
    parsed.data.type === "ADMIN_NEW_ORDER" ||
    (parsed.data.type === "ORDER_SHIPPED" && (order.status === "SHIPPED" || order.status === "DELIVERED")) ||
    (parsed.data.type === "ORDER_CANCELLED_OR_REFUNDED" && (order.status === "CANCELLED" || order.payment?.status !== "PAID"))
  );
  const target = `/admin/pedidos/${parsed.data.orderNumber}`;
  if (!applicable) {
    redirect(messageUrl(target, "error", "Este correo no corresponde al estado actual del pedido."));
  }

  try {
    const result = await deliverOrderEmail(parsed.data.orderId, parsed.data.type, { force: true });
    await prisma.auditLog.create({
      data: auditData(admin.id, "ORDER_EMAIL_RESENT", "Order", parsed.data.orderId, {
        type: parsed.data.type,
        status: result.status,
      }),
    });
    revalidatePath(target);
    redirect(messageUrl(
      target,
      result.status === "SENT" ? "ok" : "error",
      result.status === "SENT"
        ? `Correo enviado a ${result.recipient}.`
        : "No se ha podido enviar. Revisa la configuración de correo y vuelve a intentarlo.",
    ));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(messageUrl(target, "error", "No se ha podido preparar el correo. Revisa la configuración e inténtalo de nuevo."));
  }
}
