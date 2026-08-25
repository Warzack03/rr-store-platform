import { z } from "zod";

import { CART_VERSION, emptyCart, normalizeCouponCode } from "./domain";

export const cartStorageKey = "rr-store-cart";

const customizationSchema = z.object({
  customizationId: z.string().min(1).max(30),
  value: z.string().max(100),
});

export const cartLineSchema = z.object({
  id: z.string().min(1).max(100),
  dropId: z.string().min(1).max(30),
  dropProductId: z.string().min(1).max(30),
  productId: z.string().min(1).max(30),
  quantity: z.number().int().min(1).max(20),
  sizeId: z.string().min(1).max(30).nullable(),
  customizations: z.array(customizationSchema).max(2),
  components: z.array(z.object({
    bundleComponentId: z.string().min(1).max(30),
    sizeId: z.string().min(1).max(30),
    customizations: z.array(customizationSchema).max(2),
  })).max(20),
});

export const storedCartSchema = z.object({
  version: z.literal(CART_VERSION),
  lines: z.array(cartLineSchema).max(100),
  couponCode: z.string().max(100).nullable(),
});

export function readStoredCart(value: string | null) {
  if (!value) return emptyCart();
  try {
    const parsed = storedCartSchema.safeParse(JSON.parse(value));
    if (!parsed.success) return emptyCart();
    return {
      ...parsed.data,
      couponCode: parsed.data.couponCode
        ? normalizeCouponCode(parsed.data.couponCode)
        : null,
    };
  } catch {
    return emptyCart();
  }
}
