import type { StoredCart } from "./domain";

export type ValidatedCartLine = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  productType: "SIMPLE" | "BUNDLE";
  quantity: number;
  image: { url: string; altText: string } | null;
  selections: string[];
  sizeLabel: string | null;
  customizations: Array<{
    type: "NAME" | "NUMBER";
    label: string;
    value: string;
    surchargeCents: number;
  }>;
  components: Array<{
    label: string;
    productName: string;
    sizeLabel: string;
    quantity: number;
    customizations: Array<{
      type: "NAME" | "NUMBER";
      label: string;
      value: string;
      surchargeCents: number;
    }>;
  }>;
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
