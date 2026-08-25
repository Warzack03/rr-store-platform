import { unlink } from "node:fs/promises";
import path from "node:path";

import { env } from "../src/lib/env";
import { getPrismaClient } from "../src/server/db/client";

export const demoIds = {
  drops: ["demo_drop_active", "demo_drop_upcoming", "demo_drop_ended"],
  products: [
    "demo_product_shirt",
    "demo_product_shorts",
    "demo_product_scarf",
    "demo_product_pack",
  ],
  customizations: [
    "demo_custom_shirt_name",
    "demo_custom_shirt_number",
    "demo_custom_scarf_name",
  ],
  components: [
    "demo_component_pack_shirt",
    "demo_component_pack_shorts",
    "demo_component_pack_scarf",
  ],
  dropProducts: [
    "demo_dp_active_shirt",
    "demo_dp_active_shorts",
    "demo_dp_active_scarf",
    "demo_dp_active_pack",
    "demo_dp_upcoming_pack",
    "demo_dp_upcoming_scarf",
    "demo_dp_ended_shirt",
    "demo_dp_ended_pack",
  ],
  dropCustomizations: [
    "demo_dpc_shirt_name",
    "demo_dpc_shirt_number",
    "demo_dpc_scarf_name",
    "demo_dpc_pack_shirt_name",
    "demo_dpc_pack_shirt_number",
    "demo_dpc_pack_scarf_name",
  ],
  coupons: [
    "demo_coupon_percent",
    "demo_coupon_fixed",
    "demo_coupon_drop",
    "demo_coupon_inactive",
    "demo_coupon_expired",
    "demo_coupon_future",
  ],
} as const;

export function requireLocalDemoEnvironment() {
  if (env.STORE_ENV !== "local") {
    throw new Error(
      "Los datos demo solo se pueden gestionar con STORE_ENV=local.",
    );
  }
}

export async function cleanDemoData() {
  requireLocalDemoEnvironment();
  const prisma = getPrismaClient();
  const [orders, checkoutAttempts, redemptions, externalDropProducts, externalComponents] =
    await Promise.all([
      prisma.order.count({ where: { dropId: { in: [...demoIds.drops] } } }),
      prisma.checkoutAttempt.count({
        where: {
          OR: [
            { dropId: { in: [...demoIds.drops] } },
            { couponId: { in: [...demoIds.coupons] } },
          ],
        },
      }),
      prisma.couponRedemption.count({
        where: { couponId: { in: [...demoIds.coupons] } },
      }),
      prisma.dropProduct.count({
        where: {
          productId: { in: [...demoIds.products] },
          dropId: { notIn: [...demoIds.drops] },
        },
      }),
      prisma.bundleComponent.count({
        where: {
          componentProductId: { in: [...demoIds.products] },
          bundleProductId: { notIn: [...demoIds.products] },
        },
      }),
    ]);
  if (
    orders + checkoutAttempts + redemptions + externalDropProducts + externalComponents >
    0
  ) {
    throw new Error(
      "No se puede limpiar: los datos demo ya están referenciados por pedidos, checkout o catálogo ajeno.",
    );
  }

  const [products, drops, dropProducts] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: [...demoIds.products] } },
      select: {
        sizeGuideId: true,
        images: { select: { mediaAssetId: true } },
      },
    }),
    prisma.drop.findMany({
      where: { id: { in: [...demoIds.drops] } },
      select: { heroMediaId: true },
    }),
    prisma.dropProduct.findMany({
      where: { id: { in: [...demoIds.dropProducts] } },
      select: { marketingMediaId: true },
    }),
  ]);
  const sizeGuideIds = products.flatMap((product) =>
    product.sizeGuideId ? [product.sizeGuideId] : [],
  );
  const candidateMediaIds = new Set([
    ...products.flatMap((product) =>
      product.images.map((image) => image.mediaAssetId),
    ),
    ...drops.flatMap((drop) => (drop.heroMediaId ? [drop.heroMediaId] : [])),
    ...dropProducts.flatMap((item) =>
      item.marketingMediaId ? [item.marketingMediaId] : [],
    ),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.coupon.deleteMany({ where: { id: { in: [...demoIds.coupons] } } });
    await tx.drop.deleteMany({ where: { id: { in: [...demoIds.drops] } } });
    await tx.bundleComponent.deleteMany({
      where: { id: { in: [...demoIds.components] } },
    });
    await tx.product.deleteMany({ where: { id: { in: [...demoIds.products] } } });
    await tx.auditLog.deleteMany({
      where: {
        entityId: {
          in: [
            ...demoIds.drops,
            ...demoIds.products,
            ...demoIds.customizations,
            ...demoIds.components,
            ...demoIds.dropProducts,
            ...demoIds.coupons,
          ],
        },
      },
    });
  });

  for (const guideId of sizeGuideIds) {
    const guide = await prisma.sizeGuide.findUnique({
      where: { id: guideId },
      include: { _count: { select: { products: true } } },
    });
    if (guide && guide._count.products === 0) {
      candidateMediaIds.add(guide.mediaAssetId);
      await prisma.sizeGuide.delete({ where: { id: guide.id } });
    }
  }

  let removedMedia = 0;
  for (const mediaId of candidateMediaIds) {
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      include: {
        _count: {
          select: {
            sizeGuides: true,
            productImages: true,
            dropHeroes: true,
            marketingDropProducts: true,
          },
        },
      },
    });
    if (!media || Object.values(media._count).some((count) => count > 0)) continue;
    await prisma.mediaAsset.delete({ where: { id: media.id } });
    if (env.MEDIA_ROOT) {
      const mediaRoot = path.resolve(env.MEDIA_ROOT);
      const absolutePath = path.resolve(mediaRoot, ...media.storageKey.split("/"));
      if (absolutePath.startsWith(`${mediaRoot}${path.sep}`)) {
        await unlink(absolutePath).catch(() => undefined);
      }
    }
    removedMedia += 1;
  }

  return { removedMedia };
}
