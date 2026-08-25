"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth/session";
import { getPrismaClient } from "@/server/db/client";

import { auditData, cents, messageUrl, optionalText, parseDateTime, refreshAdminAndStore, slugify, uniqueSlug } from "./shared";

const dropSchema = z.object({
  title: z.string().trim().min(2).max(191), slug: z.string().trim().min(1).max(191), shortText: z.string().trim().min(2).max(10_000),
  status: z.enum(["DRAFT", "PUBLISHED"]), startsAt: z.date().nullable(), endsAt: z.date().nullable(), heroMediaId: z.string().max(30).nullable(), heroAlt: z.string().max(255).nullable(),
});

async function ensureDropIsMutable(id: string, target: string) {
  const drop = await getPrismaClient().drop.findUnique({
    where: { id },
    select: { status: true, endsAt: true },
  });
  if (drop?.status === "PUBLISHED" && drop.endsAt && drop.endsAt <= new Date()) {
    redirect(messageUrl(target, "error", "Los drops finalizados son de solo lectura."));
  }
}

export async function saveDrop(formData: FormData) {
  const admin = await requireAdmin(); const id = optionalText(formData.get("id")); const target = id ? `/admin/drops/${id}` : "/admin/drops/nuevo";
  if (id) await ensureDropIsMutable(id, "/admin/drops");
  const parsed = dropSchema.safeParse({ title: formData.get("title"), slug: slugify(String(formData.get("slug") || formData.get("title") || "")), shortText: formData.get("shortText"), status: formData.get("status"), startsAt: parseDateTime(formData.get("startsAt")), endsAt: parseDateTime(formData.get("endsAt")), heroMediaId: optionalText(formData.get("heroMediaId")), heroAlt: optionalText(formData.get("heroAlt")) });
  if (!parsed.success) redirect(messageUrl(target, "error", "Revisa la información obligatoria del drop."));
  const productIds = formData.getAll("productIds").map(String).filter(Boolean);
  if (parsed.data.status === "PUBLISHED" && (!parsed.data.startsAt || !parsed.data.endsAt || productIds.length === 0)) redirect(messageUrl(target, "error", "Para publicar indica fechas y añade al menos un producto."));
  if (parsed.data.startsAt && parsed.data.endsAt && parsed.data.endsAt <= parsed.data.startsAt) redirect(messageUrl(target, "error", "La fecha de fin debe ser posterior a la de inicio."));
  const prisma = getPrismaClient();
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { customizations: { where: { isActive: true } }, bundleComponents: { include: { componentProduct: { include: { customizations: { where: { isActive: true } } } } } } } });
  try {
    const savedId = await prisma.$transaction(async (tx) => {
      const data = { ...parsed.data, isPrimary: formData.get("isPrimary") === "on", archivedAt: null };
      const drop = id ? await tx.drop.update({ where: { id }, data }) : await tx.drop.create({ data });
      if (data.isPrimary) await tx.drop.updateMany({ where: { id: { not: drop.id }, isPrimary: true }, data: { isPrimary: false } });
      await tx.dropProduct.deleteMany({ where: { dropId: drop.id } });
      for (const [sortOrder, product] of products.entries()) {
        const priceCents = cents(formData.get(`price_${product.id}`));
        const compareAtPriceCents = cents(formData.get(`compare_${product.id}`));
        if (priceCents === null || priceCents === 0) throw new Error("invalid-price");
        const dropProduct = await tx.dropProduct.create({ data: { dropId: drop.id, productId: product.id, priceCents, compareAtPriceCents: compareAtPriceCents && compareAtPriceCents > priceCents ? compareAtPriceCents : null, isVisible: formData.get(`visible_${product.id}`) === "on", sortOrder, marketingMediaId: optionalText(formData.get(`marketing_${product.id}`)) } });
        const configurations = [
          ...product.customizations.map((custom) => ({ custom, bundleComponentId: null as string | null })),
          ...product.bundleComponents.flatMap((component) => component.componentProduct.customizations.map((custom) => ({ custom, bundleComponentId: component.id }))),
        ];
        for (const config of configurations) {
          const key = `${product.id}_${config.custom.id}_${config.bundleComponentId ?? "product"}`;
          if (formData.get(`enabled_${key}`) !== "on") continue;
          await tx.dropProductCustomization.create({ data: { dropProductId: dropProduct.id, productCustomizationId: config.custom.id, bundleComponentId: config.bundleComponentId, isEnabled: true, surchargeCents: cents(formData.get(`surcharge_${key}`)) ?? 0 } });
        }
      }
      await tx.auditLog.create({ data: auditData(admin.id, id ? "DROP_UPDATED" : "DROP_CREATED", "Drop", drop.id, { title: drop.title, status: drop.status, productCount: products.length }) });
      return drop.id;
    });
    refreshAdminAndStore(); redirect(messageUrl(`/admin/drops/${savedId}`, "ok", "Drop guardado."));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(messageUrl(target, "error", error instanceof Error && error.message === "invalid-price" ? "Todos los productos necesitan un precio mayor que cero." : "No se ha podido guardar; comprueba el slug y los datos."));
  }
}

export async function archiveDrop(formData: FormData) { const admin = await requireAdmin(); const id = String(formData.get("id") ?? ""); await ensureDropIsMutable(id, "/admin/drops"); const prisma = getPrismaClient(); await prisma.$transaction([prisma.drop.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date(), isPrimary: false } }), prisma.auditLog.create({ data: auditData(admin.id, "DROP_ARCHIVED", "Drop", id) })]); refreshAdminAndStore(); redirect(messageUrl("/admin/drops", "ok", "Drop archivado.")); }

export async function duplicateDrop(formData: FormData) {
  const admin = await requireAdmin(); const id = String(formData.get("id") ?? ""); const prisma = getPrismaClient();
  await ensureDropIsMutable(id, "/admin/drops");
  const source = await prisma.drop.findUnique({ where: { id }, include: { dropProducts: { include: { customizationPrices: true } } } });
  if (!source) redirect(messageUrl("/admin/drops", "error", "Drop no encontrado."));
  const base = source.slug ?? slugify(source.title); let slug = uniqueSlug(base, "-copia"); let index = 2;
  while (await prisma.drop.findUnique({ where: { slug }, select: { id: true } })) slug = uniqueSlug(base, `-copia-${index++}`);
  const copy = await prisma.drop.create({ data: { title: `${source.title} (copia)`.slice(0, 191), slug, shortText: source.shortText, status: "DRAFT", startsAt: null, endsAt: null, isPrimary: false, heroMediaId: source.heroMediaId, heroAlt: source.heroAlt,
    dropProducts: { create: source.dropProducts.map((item) => ({ productId: item.productId, priceCents: item.priceCents, compareAtPriceCents: item.compareAtPriceCents, isVisible: item.isVisible, sortOrder: item.sortOrder, marketingMediaId: item.marketingMediaId, customizationPrices: { create: item.customizationPrices.map((config) => ({ productCustomizationId: config.productCustomizationId, bundleComponentId: config.bundleComponentId, isEnabled: config.isEnabled, surchargeCents: config.surchargeCents })) } })) },
  } });
  await prisma.auditLog.create({ data: auditData(admin.id, "DROP_DUPLICATED", "Drop", copy.id, { sourceId: source.id }) }); refreshAdminAndStore(); redirect(messageUrl(`/admin/drops/${copy.id}`, "ok", "Copia creada sin fechas y como borrador."));
}
