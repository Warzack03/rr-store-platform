"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth/session";
import { getPrismaClient } from "@/server/db/client";

import { auditData, messageUrl, optionalText, refreshAdminAndStore, slugify, uniqueSlug } from "./shared";

const productSchema = z.object({
  name: z.string().trim().min(2).max(191),
  slug: z.string().trim().min(1).max(191),
  type: z.enum(["SIMPLE", "BUNDLE"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  shortDescription: z.string().trim().min(2).max(500),
  description: z.string().trim().min(2).max(30_000),
  seoTitle: z.string().trim().max(191).nullable(),
  seoDescription: z.string().trim().max(500).nullable(),
  sizeGuideId: z.string().trim().max(30).nullable(),
});

function productInput(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: slugify(String(formData.get("slug") || formData.get("name") || "")),
    type: formData.get("type"), status: formData.get("status"),
    shortDescription: formData.get("shortDescription"), description: formData.get("description"),
    seoTitle: optionalText(formData.get("seoTitle")), seoDescription: optionalText(formData.get("seoDescription")),
    sizeGuideId: optionalText(formData.get("sizeGuideId")),
  });
}

export async function saveProduct(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = productInput(formData);
  const id = optionalText(formData.get("id"));
  const fallbackPath = id ? `/admin/productos/${id}` : "/admin/productos/nuevo";
  if (!parsed.success) redirect(messageUrl(fallbackPath, "error", "Revisa los campos obligatorios del producto."));
  const sizeIds = formData.getAll("sizeIds").map(String).filter(Boolean);
  const mediaIds = formData.getAll("mediaIds").map(String).filter(Boolean);
  const primaryMediaId = String(formData.get("primaryMediaId") ?? "");
  const bundleRowIds = formData.getAll("bundleComponentRowIds").map(String);
  const bundleProductIds = formData.getAll("bundleComponentProductIds").map(String).filter(Boolean);
  if (parsed.data.status === "PUBLISHED" && (sizeIds.length === 0 || mediaIds.length === 0)) redirect(messageUrl(fallbackPath, "error", "Un producto publicado necesita al menos una talla y una imagen."));
  if (parsed.data.status === "PUBLISHED" && parsed.data.type === "BUNDLE" && bundleProductIds.length === 0) redirect(messageUrl(fallbackPath, "error", "Un pack publicado necesita al menos un producto componente."));
  const prisma = getPrismaClient();
  try {
    const productId = await prisma.$transaction(async (tx) => {
      const previous = id ? await tx.product.findUnique({ where: { id }, select: { slug: true } }) : null;
      const product = id
        ? await tx.product.update({ where: { id }, data: { ...parsed.data, archivedAt: null } })
        : await tx.product.create({ data: parsed.data });
      if (previous && previous.slug !== product.slug) {
        await tx.redirect.upsert({ where: { fromPath: `/productos/${previous.slug}` }, update: { toPath: `/productos/${product.slug}`, statusCode: 301 }, create: { fromPath: `/productos/${previous.slug}`, toPath: `/productos/${product.slug}`, statusCode: 301 } });
      }
      await tx.productSize.deleteMany({ where: { productId: product.id } });
      if (sizeIds.length) await tx.productSize.createMany({ data: sizeIds.map((sizeId, sortOrder) => ({ productId: product.id, sizeId, sortOrder })) });
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (mediaIds.length) await tx.productImage.createMany({ data: mediaIds.map((mediaAssetId, sortOrder) => ({ productId: product.id, mediaAssetId, sortOrder, isPrimary: mediaAssetId === primaryMediaId || (!primaryMediaId && sortOrder === 0), altText: String(formData.get(`alt_${mediaAssetId}`) || parsed.data.name).slice(0, 255) })) });
      const customizationInputs = [
        { type: "NAME" as const, enabled: formData.get("enableName") === "on", label: String(formData.get("nameLabel") || "Nombre"), maxLength: Number(formData.get("nameMaxLength") || 12), minNumber: null, maxNumber: null, sortOrder: 0 },
        { type: "NUMBER" as const, enabled: formData.get("enableNumber") === "on", label: String(formData.get("numberLabel") || "Dorsal"), maxLength: null, minNumber: Number(formData.get("numberMin") || 0), maxNumber: Number(formData.get("numberMax") || 99), sortOrder: 1 },
      ];
      for (const custom of customizationInputs) {
        await tx.productCustomization.upsert({ where: { productId_type: { productId: product.id, type: custom.type } }, update: { label: custom.label.slice(0, 100), maxLength: custom.maxLength, minNumber: custom.minNumber, maxNumber: custom.maxNumber, sortOrder: custom.sortOrder, isActive: custom.enabled }, create: { productId: product.id, type: custom.type, label: custom.label.slice(0, 100), maxLength: custom.maxLength, minNumber: custom.minNumber, maxNumber: custom.maxNumber, sortOrder: custom.sortOrder, isActive: custom.enabled } });
      }
      if (parsed.data.type === "BUNDLE") {
        const existingComponents = await tx.bundleComponent.findMany({ where: { bundleProductId: product.id }, select: { id: true } });
        const existingIds = new Set(existingComponents.map((component) => component.id));
        const submittedRows = bundleProductIds.map((componentProductId, index) => ({
          rowId: bundleRowIds[index] ?? "",
          componentProductId,
          sortOrder: index,
          label: `Producto ${index + 1}`,
        })).filter((component) => component.componentProductId !== product.id);
        const keptIds = submittedRows.map((component) => component.rowId).filter((rowId) => existingIds.has(rowId));
        await tx.bundleComponent.deleteMany({ where: { bundleProductId: product.id, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) } });
        for (const component of submittedRows) {
          if (existingIds.has(component.rowId)) {
            await tx.bundleComponent.update({ where: { id: component.rowId }, data: { componentProductId: component.componentProductId, label: component.label, sortOrder: component.sortOrder } });
          } else {
            await tx.bundleComponent.create({ data: { bundleProductId: product.id, componentProductId: component.componentProductId, label: component.label, sortOrder: component.sortOrder } });
          }
        }
      } else await tx.bundleComponent.deleteMany({ where: { bundleProductId: product.id } });
      await tx.auditLog.create({ data: auditData(admin.id, id ? "PRODUCT_UPDATED" : "PRODUCT_CREATED", "Product", product.id, { name: product.name, status: product.status, slug: product.slug }) });
      return product.id;
    });
    refreshAdminAndStore();
    redirect(messageUrl(`/admin/productos/${productId}`, "ok", "Producto guardado."));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(messageUrl(fallbackPath, "error", "No se ha podido guardar. Comprueba que el slug sea único."));
  }
}

export async function archiveProduct(formData: FormData) {
  const admin = await requireAdmin(); const id = String(formData.get("id") ?? "");
  const prisma = getPrismaClient();
  await prisma.$transaction([
    prisma.product.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() } }),
    prisma.auditLog.create({ data: auditData(admin.id, "PRODUCT_ARCHIVED", "Product", id) }),
  ]);
  refreshAdminAndStore(); redirect(messageUrl("/admin/productos", "ok", "Producto archivado."));
}

export async function duplicateProduct(formData: FormData) {
  const admin = await requireAdmin(); const id = String(formData.get("id") ?? ""); const prisma = getPrismaClient();
  const source = await prisma.product.findUnique({ where: { id }, include: { sizes: true, images: true, customizations: true, bundleComponents: true } });
  if (!source) redirect(messageUrl("/admin/productos", "error", "Producto no encontrado."));
  let slug = uniqueSlug(source.slug, "-copia"); let index = 2;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) slug = uniqueSlug(source.slug, `-copia-${index++}`);
  const copy = await prisma.product.create({ data: {
    type: source.type, status: "DRAFT", name: `${source.name} (copia)`.slice(0, 191), slug, shortDescription: source.shortDescription, description: source.description, seoTitle: source.seoTitle, seoDescription: source.seoDescription, sizeGuideId: source.sizeGuideId,
    sizes: { create: source.sizes.map((item) => ({ sizeId: item.sizeId, sortOrder: item.sortOrder })) },
    images: { create: source.images.map((item) => ({ mediaAssetId: item.mediaAssetId, sortOrder: item.sortOrder, isPrimary: item.isPrimary, altText: item.altText })) },
    customizations: { create: source.customizations.map((item) => ({ type: item.type, label: item.label, maxLength: item.maxLength, minNumber: item.minNumber, maxNumber: item.maxNumber, sortOrder: item.sortOrder, isActive: item.isActive })) },
    bundleComponents: { create: source.bundleComponents.map((item) => ({ componentProductId: item.componentProductId, label: item.label, quantity: item.quantity, sortOrder: item.sortOrder })) },
  } });
  await prisma.auditLog.create({ data: auditData(admin.id, "PRODUCT_DUPLICATED", "Product", copy.id, { sourceId: source.id }) });
  refreshAdminAndStore(); redirect(messageUrl(`/admin/productos/${copy.id}`, "ok", "Copia creada como borrador."));
}
