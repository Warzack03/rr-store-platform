"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { fileTypeFromBuffer } from "file-type";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth/session";
import { env } from "@/lib/env";
import { getPrismaClient } from "@/server/db/client";

import { auditData, messageUrl, optionalText, refreshAdminAndStore } from "./shared";

const idSchema = z.string().min(1).max(30);
const sizeSchema = z.object({
  label: z.string().trim().min(1).max(50),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
});

export async function createSize(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = sizeSchema.safeParse({ label: formData.get("label"), sortOrder: formData.get("sortOrder") });
  if (!parsed.success) redirect(messageUrl("/admin/tallas", "error", "Revisa la etiqueta y el orden."));
  const prisma = getPrismaClient();
  try {
    const size = await prisma.size.create({ data: parsed.data });
    await prisma.auditLog.create({ data: auditData(admin.id, "SIZE_CREATED", "Size", size.id, { label: size.label }) });
  } catch {
    redirect(messageUrl("/admin/tallas", "error", "La talla ya existe o no se ha podido guardar."));
  }
  refreshAdminAndStore();
  redirect(messageUrl("/admin/tallas", "ok", "Talla creada."));
}

export async function updateSize(formData: FormData) {
  const admin = await requireAdmin();
  const id = idSchema.safeParse(formData.get("id"));
  const parsed = sizeSchema.safeParse({ label: formData.get("label"), sortOrder: formData.get("sortOrder") });
  if (!id.success || !parsed.success) redirect(messageUrl("/admin/tallas", "error", "Datos de talla no válidos."));
  const prisma = getPrismaClient();
  try {
    await prisma.$transaction([
      prisma.size.update({ where: { id: id.data }, data: { ...parsed.data, isActive: formData.get("isActive") === "on" } }),
      prisma.auditLog.create({ data: auditData(admin.id, "SIZE_UPDATED", "Size", id.data, { label: parsed.data.label }) }),
    ]);
  } catch {
    redirect(messageUrl("/admin/tallas", "error", "No se ha podido actualizar la talla."));
  }
  refreshAdminAndStore();
  redirect(messageUrl("/admin/tallas", "ok", "Talla actualizada."));
}

const guideSchema = z.object({
  name: z.string().trim().min(2).max(191),
  mediaAssetId: idSchema,
  altText: z.string().trim().min(2).max(255),
});

export async function saveSizeGuide(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = guideSchema.safeParse({ name: formData.get("name"), mediaAssetId: formData.get("mediaAssetId"), altText: formData.get("altText") });
  const id = optionalText(formData.get("id"));
  const target = id ? `/admin/guias-tallas/${id}` : "/admin/guias-tallas/nueva";
  if (!parsed.success) redirect(messageUrl(target, "error", "Completa nombre, imagen y texto alternativo."));
  const prisma = getPrismaClient();
  try {
    if (id) {
      await prisma.$transaction([
        prisma.sizeGuide.update({ where: { id }, data: parsed.data }),
        prisma.auditLog.create({ data: auditData(admin.id, "SIZE_GUIDE_UPDATED", "SizeGuide", id, { name: parsed.data.name }) }),
      ]);
    } else {
      const guide = await prisma.sizeGuide.create({ data: parsed.data });
      await prisma.auditLog.create({ data: auditData(admin.id, "SIZE_GUIDE_CREATED", "SizeGuide", guide.id, { name: guide.name }) });
    }
  } catch {
    redirect(messageUrl(target, "error", "No se ha podido guardar la guía."));
  }
  refreshAdminAndStore();
  redirect(messageUrl("/admin/guias-tallas", "ok", "Guía guardada."));
}

export async function deleteSizeGuide(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;
  const prisma = getPrismaClient();
  const guide = await prisma.sizeGuide.findUnique({ where: { id: parsed.data }, select: { _count: { select: { products: true } } } });
  if (!guide || guide._count.products > 0) redirect(messageUrl("/admin/guias-tallas", "error", "La guía está en uso y no se puede eliminar."));
  await prisma.$transaction([
    prisma.sizeGuide.delete({ where: { id: parsed.data } }),
    prisma.auditLog.create({ data: auditData(admin.id, "SIZE_GUIDE_DELETED", "SizeGuide", parsed.data) }),
  ]);
  refreshAdminAndStore();
  redirect(messageUrl("/admin/guias-tallas", "ok", "Guía eliminada."));
}

const allowedUploads = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function uploadMedia(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 8 * 1024 * 1024) {
    redirect(messageUrl("/admin/medios", "error", "Selecciona una imagen de hasta 8 MB."));
  }
  if (!env.MEDIA_ROOT) redirect(messageUrl("/admin/medios", "error", "MEDIA_ROOT no está configurado."));
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const extension = detected ? allowedUploads.get(detected.mime) : null;
  if (!detected || !extension) redirect(messageUrl("/admin/medios", "error", "Solo se admiten JPG, PNG y WebP reales."));
  const metadata = await sharp(buffer).metadata().catch(() => null);
  if (!metadata) {
    redirect(messageUrl("/admin/medios", "error", "El archivo no es una imagen válida."));
  }
  if (!metadata.width || !metadata.height) redirect(messageUrl("/admin/medios", "error", "No se han podido leer las dimensiones."));
  const now = new Date();
  const storageKey = `media/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extension}`;
  const mediaRoot = path.resolve(env.MEDIA_ROOT);
  const absolutePath = path.resolve(mediaRoot, ...storageKey.split("/"));
  if (!absolutePath.startsWith(`${mediaRoot}${path.sep}`)) throw new Error("Ruta de medios no válida.");
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer, { flag: "wx" });
  const prisma = getPrismaClient();
  try {
    const media = await prisma.mediaAsset.create({ data: { storageKey, originalName: file.name.slice(0, 255), mimeType: detected.mime, byteSize: BigInt(file.size), width: metadata.width, height: metadata.height, altText: optionalText(formData.get("altText")) } });
    await prisma.auditLog.create({ data: auditData(admin.id, "MEDIA_UPLOADED", "MediaAsset", media.id, { originalName: media.originalName, mimeType: media.mimeType }) });
  } catch (error) {
    await unlink(absolutePath).catch(() => undefined);
    throw error;
  }
  refreshAdminAndStore();
  redirect(messageUrl("/admin/medios", "ok", "Imagen subida."));
}

export async function deleteMedia(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) return;
  const prisma = getPrismaClient();
  const media = await prisma.mediaAsset.findUnique({ where: { id: parsed.data }, include: { _count: { select: { sizeGuides: true, productImages: true, dropHeroes: true, marketingDropProducts: true } } } });
  if (!media) return;
  const usages = Object.values(media._count).reduce((sum, count) => sum + count, 0);
  if (usages > 0) redirect(messageUrl("/admin/medios", "error", "La imagen está en uso y no se puede eliminar."));
  await prisma.$transaction([
    prisma.mediaAsset.delete({ where: { id: media.id } }),
    prisma.auditLog.create({ data: auditData(admin.id, "MEDIA_DELETED", "MediaAsset", media.id, { originalName: media.originalName }) }),
  ]);
  if (env.MEDIA_ROOT) {
    const mediaRoot = path.resolve(env.MEDIA_ROOT);
    const absolutePath = path.resolve(mediaRoot, ...media.storageKey.split("/"));
    if (absolutePath.startsWith(`${mediaRoot}${path.sep}`)) await unlink(absolutePath).catch(() => undefined);
  }
  refreshAdminAndStore();
  redirect(messageUrl("/admin/medios", "ok", "Imagen eliminada."));
}
