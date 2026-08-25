"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth/session";
import { normalizeCouponCode } from "@/features/cart/domain";
import { getPrismaClient } from "@/server/db/client";

import {
  auditData,
  cents,
  messageUrl,
  optionalText,
  parseDateTime,
  refreshAdminAndStore,
} from "./shared";

const couponSchema = z.object({
  code: z.string().min(2).max(100).regex(/^[A-Z0-9_-]+$/),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().positive(),
  dropId: z.string().max(30).nullable(),
  minOrderCents: z.number().int().nonnegative().nullable(),
  maxRedemptions: z.number().int().positive().nullable(),
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  isActive: z.boolean(),
});

function positiveInteger(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number > 0 ? number : Number.NaN;
}

export async function saveCoupon(formData: FormData) {
  const admin = await requireAdmin();
  const id = optionalText(formData.get("id"));
  const target = id ? `/admin/cupones/${id}` : "/admin/cupones/nuevo";
  const type = formData.get("type");
  const rawValue = type === "FIXED"
    ? cents(formData.get("value"))
    : Number(String(formData.get("value") ?? "").trim());
  const rawMinimum = String(formData.get("minOrder") ?? "").trim();
  const parsed = couponSchema.safeParse({
    code: normalizeCouponCode(String(formData.get("code") ?? "")),
    type,
    value: rawValue,
    dropId: optionalText(formData.get("dropId")),
    minOrderCents: rawMinimum ? cents(formData.get("minOrder")) : null,
    maxRedemptions: positiveInteger(formData.get("maxRedemptions")),
    startsAt: parseDateTime(formData.get("startsAt")),
    endsAt: parseDateTime(formData.get("endsAt")),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    redirect(messageUrl(target, "error", "Revisa el código, el valor y los límites del cupón."));
  }
  if (parsed.data.type === "PERCENT" && parsed.data.value > 100) {
    redirect(messageUrl(target, "error", "El descuento porcentual debe estar entre 1 y 100."));
  }
  if (parsed.data.startsAt && parsed.data.endsAt && parsed.data.endsAt <= parsed.data.startsAt) {
    redirect(messageUrl(target, "error", "La fecha de fin debe ser posterior a la de inicio."));
  }

  const prisma = getPrismaClient();
  try {
    const coupon = await prisma.$transaction(async (tx) => {
      const data = { ...parsed.data, ...(id ? {} : { archivedAt: null }) };
      const saved = id
        ? await tx.coupon.update({ where: { id }, data })
        : await tx.coupon.create({ data });
      await tx.auditLog.create({
        data: auditData(
          admin.id,
          id ? "COUPON_UPDATED" : "COUPON_CREATED",
          "Coupon",
          saved.id,
          { code: saved.code, type: saved.type, isActive: saved.isActive },
        ),
      });
      return saved;
    });
    refreshAdminAndStore();
    redirect(messageUrl(`/admin/cupones/${coupon.id}`, "ok", "Cupón guardado."));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(messageUrl(target, "error", "No se ha podido guardar. Comprueba que el código no esté repetido."));
  }
}

export async function archiveCoupon(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const prisma = getPrismaClient();
  await prisma.$transaction([
    prisma.coupon.update({
      where: { id },
      data: { isActive: false, archivedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: auditData(admin.id, "COUPON_ARCHIVED", "Coupon", id),
    }),
  ]);
  refreshAdminAndStore();
  redirect(messageUrl("/admin/cupones", "ok", "Cupón archivado."));
}
