import "server-only";
import { getPrismaClient } from "@/server/db/client";

export async function getDropFormOptions() { const prisma = getPrismaClient(); const [products, media] = await Promise.all([prisma.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, include: { customizations: { where: { isActive: true }, orderBy: { sortOrder: "asc" } }, bundleComponents: { orderBy: { sortOrder: "asc" }, include: { componentProduct: { include: { customizations: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } } } } } }), prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, originalName: true, storageKey: true } })]); return { products, media }; }
