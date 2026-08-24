import "server-only";

import { getPrismaClient } from "@/server/db/client";

export async function getProductFormOptions(excludeProductId?: string) {
  const prisma = getPrismaClient();
  const [sizes, guides, media, components] = await Promise.all([
    prisma.size.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { label: "asc" }], select: { id: true, label: true } }),
    prisma.sizeGuide.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, originalName: true, storageKey: true, width: true, height: true } }),
    prisma.product.findMany({ where: { status: { not: "ARCHIVED" }, ...(excludeProductId ? { id: { not: excludeProductId } } : {}) }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { sizes, guides, media, components };
}
