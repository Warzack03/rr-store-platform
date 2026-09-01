"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth/session";
import { auditData, cents, messageUrl, optionalText } from "@/features/admin/server/shared";
import { getPrismaClient } from "@/server/db/client";

const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(191),
  supportEmail: z.email().max(320),
  deliveryEstimateText: z.string().trim().min(2).max(500),
  globalNotice: z.string().trim().max(1_000).nullable(),
  globalNoticeEnabled: z.boolean(),
  shippingCents: z.number().int().positive(),
  shippingEnabled: z.boolean(),
});

export async function saveStoreSettings(formData: FormData) {
  const parsed = settingsSchema.safeParse({
    storeName: formData.get("storeName"),
    supportEmail: formData.get("supportEmail"),
    deliveryEstimateText: formData.get("deliveryEstimateText"),
    globalNotice: optionalText(formData.get("globalNotice")),
    globalNoticeEnabled: formData.get("globalNoticeEnabled") === "on",
    shippingCents: cents(formData.get("shippingPrice")),
    shippingEnabled: formData.get("shippingEnabled") === "on",
  });
  const target = "/admin/configuracion";
  if (!parsed.success || (parsed.data.globalNoticeEnabled && !parsed.data.globalNotice)) {
    redirect(messageUrl(target, "error", "Revisa el nombre, el email, el envío y el aviso global."));
  }
  const admin = await requireAdmin();
  const prisma = getPrismaClient();
  await prisma.$transaction(async (tx) => {
    await tx.storeSettings.upsert({
      where: { id: 1 },
      update: {
        storeName: parsed.data.storeName,
        supportEmail: parsed.data.supportEmail,
        deliveryEstimateText: parsed.data.deliveryEstimateText,
        globalNotice: parsed.data.globalNotice,
        globalNoticeEnabled: parsed.data.globalNoticeEnabled,
      },
      create: {
        id: 1,
        storeName: parsed.data.storeName,
        supportEmail: parsed.data.supportEmail,
        deliveryEstimateText: parsed.data.deliveryEstimateText,
        globalNotice: parsed.data.globalNotice,
        globalNoticeEnabled: parsed.data.globalNoticeEnabled,
      },
    });
    await tx.shippingMethod.upsert({
      where: { kind: "HOME" },
      update: { displayName: "Envío a domicilio", priceCents: parsed.data.shippingCents, isEnabled: parsed.data.shippingEnabled, sortOrder: 10 },
      create: { kind: "HOME", displayName: "Envío a domicilio", priceCents: parsed.data.shippingCents, isEnabled: parsed.data.shippingEnabled, sortOrder: 10 },
    });
    await tx.auditLog.create({
      data: auditData(admin.id, "STORE_SETTINGS_UPDATED", "StoreSettings", "1", {
        shippingCents: parsed.data.shippingCents,
        shippingEnabled: parsed.data.shippingEnabled,
        globalNoticeEnabled: parsed.data.globalNoticeEnabled,
      }),
    });
  });
  revalidateTag("store-settings", "max");
  revalidatePath("/", "layout");
  revalidatePath("/checkout");
  revalidatePath(target);
  redirect(messageUrl(target, "ok", "Configuración guardada."));
}
