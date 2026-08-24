import type {
  CustomizationType,
  ProductType,
} from "@/generated/prisma/enums";

import type { PublicDropState } from "./domain";

export type CatalogMedia = {
  id: string;
  url: string;
  width: number;
  height: number;
  altText: string;
};

export type PublicPrice = {
  priceCents: number;
  compareAtPriceCents: number | null;
};

export type CatalogProductCard = {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  image: CatalogMedia | null;
  dropTitle: string;
  dropState: PublicDropState;
  price: PublicPrice | null;
};

export type CatalogDrop = {
  id: string;
  slug: string | null;
  title: string;
  shortText: string;
  startsAt: string;
  endsAt: string;
  state: PublicDropState;
  isPrimary: boolean;
  hero: CatalogMedia | null;
  products: CatalogProductCard[];
};

export type ProductSizeView = {
  id: string;
  label: string;
};

export type ProductCustomizationView = {
  id: string;
  type: CustomizationType;
  label: string;
  maxLength: number | null;
  minNumber: number | null;
  maxNumber: number | null;
  surchargeCents: number | null;
};

export type BundleComponentView = {
  id: string;
  label: string;
  name: string;
  sizes: ProductSizeView[];
  customizations: ProductCustomizationView[];
};

export type CatalogProductDetail = {
  id: string;
  type: ProductType;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  images: CatalogMedia[];
  sizes: ProductSizeView[];
  sizeGuide: {
    name: string;
    image: CatalogMedia;
  } | null;
  customizations: ProductCustomizationView[];
  bundleComponents: BundleComponentView[];
  drop: {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    state: PublicDropState;
    publicPrice: PublicPrice | null;
    historicalPriceCents: number | null;
  };
  relatedProducts: CatalogProductCard[];
};
