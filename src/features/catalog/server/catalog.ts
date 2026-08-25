import "server-only";

import { cache } from "react";

import { getPrismaClient } from "@/server/db/client";

import {
  comparePublicDrops,
  getPublicDropState,
  getPublicPrice,
} from "../domain";
import type {
  CatalogDrop,
  CatalogMedia,
  CatalogProductCard,
  CatalogProductDetail,
  ProductCustomizationView,
  ProductSizeView,
} from "../types";

const prisma = getPrismaClient();

type MediaRecord = {
  id: string;
  storageKey: string;
  width: number;
  height: number;
  altText: string | null;
};

function mediaUrl(storageKey: string) {
  return `/media/${storageKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

function toCatalogMedia(
  media: MediaRecord,
  fallbackAlt: string,
  relationAlt?: string | null,
): CatalogMedia {
  return {
    id: media.id,
    url: mediaUrl(media.storageKey),
    width: media.width,
    height: media.height,
    altText: relationAlt ?? media.altText ?? fallbackAlt,
  };
}

const publicProductWhere = {
  status: "PUBLISHED" as const,
  archivedAt: null,
};

async function loadPublishedDrops() {
  return prisma.drop.findMany({
    where: {
      status: "PUBLISHED",
      archivedAt: null,
      startsAt: { not: null },
      endsAt: { not: null },
    },
    include: {
      heroMedia: true,
      dropProducts: {
        where: {
          isVisible: true,
          product: publicProductWhere,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          marketingMedia: true,
          product: {
            include: {
              images: {
                orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                include: { mediaAsset: true },
              },
            },
          },
        },
      },
    },
  });
}

function toProductCard(
  dropProduct: Awaited<ReturnType<typeof loadPublishedDrops>>[number]["dropProducts"][number],
  drop: { title: string; state: CatalogDrop["state"]; startsAt?: Date; endsAt?: Date },
): CatalogProductCard {
  const primaryImage = dropProduct.product.images[0];
  const image = dropProduct.marketingMedia
    ? toCatalogMedia(dropProduct.marketingMedia, dropProduct.product.name)
    : primaryImage
      ? toCatalogMedia(
          primaryImage.mediaAsset,
          dropProduct.product.name,
          primaryImage.altText,
        )
      : null;

  return {
    id: dropProduct.product.id,
    name: dropProduct.product.name,
    slug: dropProduct.product.slug,
    type: dropProduct.product.type,
    image,
    dropTitle: drop.title,
    dropState: drop.state,
    availabilityDate:
      drop.state === "AVAILABLE"
        ? drop.endsAt?.toISOString() ?? null
        : drop.state === "UPCOMING"
          ? drop.startsAt?.toISOString() ?? null
          : null,
    price: getPublicPrice(
      drop.state,
      dropProduct.priceCents,
      dropProduct.compareAtPriceCents,
    ),
  };
}

export const getPublicCatalog = cache(async (): Promise<CatalogDrop[]> => {
  const now = new Date();
  const drops = await loadPublishedDrops();

  return drops
    .flatMap((drop) => {
      if (!drop.startsAt || !drop.endsAt) return [];

      const state = getPublicDropState(
        { startsAt: drop.startsAt, endsAt: drop.endsAt },
        now,
      );
      const catalogDrop: CatalogDrop = {
        id: drop.id,
        slug: drop.slug,
        title: drop.title,
        shortText: drop.shortText,
        startsAt: drop.startsAt.toISOString(),
        endsAt: drop.endsAt.toISOString(),
        state,
        isPrimary: drop.isPrimary,
        hero: drop.heroMedia
          ? toCatalogMedia(drop.heroMedia, drop.title, drop.heroAlt)
          : null,
        products: drop.dropProducts.map((dropProduct) =>
          toProductCard(dropProduct, {
            title: drop.title,
            state,
            startsAt: drop.startsAt!,
            endsAt: drop.endsAt!,
          }),
        ),
      };

      return [catalogDrop];
    })
    .sort((left, right) =>
      comparePublicDrops(
        {
          state: left.state,
          startsAt: new Date(left.startsAt),
          endsAt: new Date(left.endsAt),
          isPrimary: left.isPrimary,
        },
        {
          state: right.state,
          startsAt: new Date(right.startsAt),
          endsAt: new Date(right.endsAt),
          isPrimary: right.isPrimary,
        },
      ),
    );
});

async function loadPublishedProducts() {
  return prisma.product.findMany({
    where: publicProductWhere,
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        include: { mediaAsset: true },
      },
      dropProducts: {
        where: {
          isVisible: true,
          drop: {
            status: "PUBLISHED",
            archivedAt: null,
            startsAt: { not: null },
            endsAt: { not: null },
          },
        },
        include: { marketingMedia: true, drop: true },
      },
    },
  });
}

export const getPublicProducts = cache(async (): Promise<CatalogProductCard[]> => {
  const now = new Date();
  const products = await loadPublishedProducts();
  const cards = products.map((product) => {
    const dropProducts = product.dropProducts
      .flatMap((dropProduct) => {
        if (!dropProduct.drop.startsAt || !dropProduct.drop.endsAt) return [];
        const state = getPublicDropState(
          { startsAt: dropProduct.drop.startsAt, endsAt: dropProduct.drop.endsAt },
          now,
        );
        return [{ ...dropProduct, state }];
      })
      .sort((left, right) =>
        comparePublicDrops(
          { state: left.state, startsAt: left.drop.startsAt!, endsAt: left.drop.endsAt!, isPrimary: left.drop.isPrimary },
          { state: right.state, startsAt: right.drop.startsAt!, endsAt: right.drop.endsAt!, isPrimary: right.drop.isPrimary },
        ),
      );
    const current = dropProducts.find((item) => item.state !== "ENDED");
    const primaryImage = product.images[0];
    const selectedImage = current?.marketingMedia;
    const image = selectedImage
      ? toCatalogMedia(selectedImage, product.name)
      : primaryImage
        ? toCatalogMedia(primaryImage.mediaAsset, product.name, primaryImage.altText)
        : null;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      type: product.type,
      image,
      dropTitle: current?.drop.title ?? null,
      dropState: current?.state ?? "UNAVAILABLE",
      availabilityDate: current
        ? (current.state === "AVAILABLE" ? current.drop.endsAt : current.drop.startsAt)?.toISOString() ?? null
        : null,
      price: current
        ? getPublicPrice(current.state, current.priceCents, current.compareAtPriceCents)
        : null,
    } satisfies CatalogProductCard;
  });
  const stateOrder: Record<CatalogProductCard["dropState"], number> = {
    AVAILABLE: 0,
    UPCOMING: 1,
    UNAVAILABLE: 2,
    ENDED: 2,
  };
  return cards.sort(
    (left, right) =>
      stateOrder[left.dropState] - stateOrder[right.dropState] ||
      left.name.localeCompare(right.name, "es"),
  );
});

function sortSizes(
  sizes: Array<{
    sortOrder: number | null;
    size: { id: string; label: string; sortOrder: number };
  }>,
): ProductSizeView[] {
  return [...sizes]
    .sort(
      (left, right) =>
        (left.sortOrder ?? left.size.sortOrder) -
        (right.sortOrder ?? right.size.sortOrder),
    )
    .map(({ size }) => ({ id: size.id, label: size.label }));
}

type CustomizationSource = {
  id: string;
  type: "NAME" | "NUMBER";
  label: string;
  maxLength: number | null;
  minNumber: number | null;
  maxNumber: number | null;
  sortOrder: number;
};

function toCustomization(
  customization: CustomizationSource,
  surchargeCents: number | null,
): ProductCustomizationView {
  return {
    id: customization.id,
    type: customization.type,
    label: customization.label,
    maxLength: customization.maxLength,
    minNumber: customization.minNumber,
    maxNumber: customization.maxNumber,
    surchargeCents,
  };
}

async function loadProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, ...publicProductWhere },
    include: {
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        include: { mediaAsset: true },
      },
      sizes: { include: { size: true } },
      sizeGuide: { include: { mediaAsset: true } },
      customizations: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      bundleComponents: {
        orderBy: { sortOrder: "asc" },
        include: {
          componentProduct: {
            include: {
              sizes: { include: { size: true } },
              customizations: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      dropProducts: {
        where: {
          isVisible: true,
          drop: {
            status: "PUBLISHED",
            archivedAt: null,
            startsAt: { not: null },
            endsAt: { not: null },
          },
        },
        include: {
          drop: true,
          customizationPrices: {
            where: { isEnabled: true },
            include: { productCustomization: true },
          },
        },
      },
    },
  });
}

export const getPublicProduct = cache(
  async (slug: string): Promise<CatalogProductDetail | null> => {
    const product = await loadProduct(slug);
    if (!product) return null;

    const now = new Date();
    const availableDropProducts = product.dropProducts
      .flatMap((dropProduct) => {
        if (!dropProduct.drop.startsAt || !dropProduct.drop.endsAt) return [];
        const state = getPublicDropState(
          {
            startsAt: dropProduct.drop.startsAt,
            endsAt: dropProduct.drop.endsAt,
          },
          now,
        );
        return [{ ...dropProduct, publicState: state }];
      })
      .sort((left, right) =>
        comparePublicDrops(
          {
            state: left.publicState,
            startsAt: left.drop.startsAt!,
            endsAt: left.drop.endsAt!,
            isPrimary: left.drop.isPrimary,
          },
          {
            state: right.publicState,
            startsAt: right.drop.startsAt!,
            endsAt: right.drop.endsAt!,
            isPrimary: right.drop.isPrimary,
          },
        ),
      );
    const selectedDropProduct = availableDropProducts[0];

    const surchargeByCustomization = new Map(
      (selectedDropProduct?.customizationPrices ?? []).map((configuration) => [
        `${configuration.productCustomizationId}:${configuration.bundleComponentId ?? "product"}`,
        configuration.surchargeCents,
      ]),
    );
    const hasCustomization = (customizationId: string, componentId?: string) =>
      surchargeByCustomization.has(
        `${customizationId}:${componentId ?? "product"}`,
      );
    const publicSurcharge = (customizationId: string, componentId?: string) => {
      if (selectedDropProduct?.publicState !== "AVAILABLE") return null;
      return (
        surchargeByCustomization.get(
          `${customizationId}:${componentId ?? "product"}`,
        ) ?? null
      );
    };

    const relatedDropProducts = selectedDropProduct
      ? await prisma.dropProduct.findMany({
      where: {
        dropId: selectedDropProduct.dropId,
        productId: { not: product.id },
        isVisible: true,
        product: publicProductWhere,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        marketingMedia: true,
        product: {
          include: {
            images: {
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
              include: { mediaAsset: true },
            },
          },
        },
      },
        })
      : [];

    return {
      id: product.id,
      type: product.type,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      images: product.images.map((image) =>
        toCatalogMedia(
          image.mediaAsset,
          product.name,
          image.altText,
        ),
      ),
      sizes: sortSizes(product.sizes),
      sizeGuide: product.sizeGuide
        ? {
            name: product.sizeGuide.name,
            image: toCatalogMedia(
              product.sizeGuide.mediaAsset,
              product.sizeGuide.name,
              product.sizeGuide.altText,
            ),
          }
        : null,
      customizations: product.customizations
        .filter((customization) => hasCustomization(customization.id))
        .map((customization) =>
          toCustomization(
            customization,
            publicSurcharge(customization.id),
          ),
        ),
      bundleComponents: product.bundleComponents.map((component) => ({
        id: component.id,
        label: component.label,
        name: component.componentProduct.name,
        sizes: sortSizes(component.componentProduct.sizes),
        customizations: component.componentProduct.customizations
          .filter((customization) =>
            hasCustomization(customization.id, component.id),
          )
          .map((customization) =>
            toCustomization(
              customization,
              publicSurcharge(customization.id, component.id),
            ),
          ),
      })),
      drop: selectedDropProduct?.drop.startsAt && selectedDropProduct.drop.endsAt ? {
        id: selectedDropProduct.drop.id,
        dropProductId: selectedDropProduct.id,
        title: selectedDropProduct.drop.title,
        startsAt: selectedDropProduct.drop.startsAt.toISOString(),
        endsAt: selectedDropProduct.drop.endsAt.toISOString(),
        state: selectedDropProduct.publicState,
        publicPrice: getPublicPrice(
          selectedDropProduct.publicState,
          selectedDropProduct.priceCents,
          selectedDropProduct.compareAtPriceCents,
        ),
        historicalPriceCents:
          selectedDropProduct.publicState === "ENDED"
            ? selectedDropProduct.priceCents
            : null,
      } : null,
      relatedProducts: relatedDropProducts.map((dropProduct) =>
        toProductCard(dropProduct, {
          title: selectedDropProduct.drop.title,
          state: selectedDropProduct.publicState,
        }),
      ),
    };
  },
);

export async function getPublicProductSlugs() {
  const products = await prisma.product.findMany({
    where: publicProductWhere,
    select: { slug: true, updatedAt: true },
  });

  return products;
}
