import type { StoredCart } from "./domain";

export type ValidatedCartLine = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  quantity: number;
  image: { url: string; altText: string } | null;
  selections: string[];
  unitBasePriceCents: number;
  unitCustomizationCents: number;
  unitTotalCents: number;
  lineTotalCents: number;
};

export type ValidatedCart = {
  cart: StoredCart;
  dropId: string | null;
  dropTitle: string | null;
  dropEndsAt: string | null;
  lines: ValidatedCartLine[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  coupon: { code: string; description: string } | null;
  couponError: string | null;
  issues: string[];
};
