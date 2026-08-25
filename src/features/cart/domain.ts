export const CART_VERSION = 1 as const;
export const MAX_LINE_QUANTITY = 20;

export type CartCustomizationSelection = {
  customizationId: string;
  value: string;
};

export type CartComponentSelection = {
  bundleComponentId: string;
  sizeId: string;
  customizations: CartCustomizationSelection[];
};

export type CartLine = {
  id: string;
  dropId: string;
  dropProductId: string;
  productId: string;
  quantity: number;
  sizeId: string | null;
  customizations: CartCustomizationSelection[];
  components: CartComponentSelection[];
};

export type StoredCart = {
  version: typeof CART_VERSION;
  lines: CartLine[];
  couponCode: string | null;
};

export const emptyCart = (): StoredCart => ({
  version: CART_VERSION,
  lines: [],
  couponCode: null,
});

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleUpperCase("es-ES");
}

export function normalizeCouponCode(value: string) {
  return value.trim().toLocaleUpperCase("es-ES");
}

export function normalizeDorsal(value: string) {
  return value.replace(/\D/g, "").slice(0, 2);
}

export function isValidDorsal(value: string, min = 0, max = 99) {
  return /^\d{2}$/.test(value) && Number(value) >= min && Number(value) <= max;
}

export function clampQuantity(value: number) {
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.trunc(value) || 1));
}

function canonicalCustomizations(values: CartCustomizationSelection[]) {
  return [...values]
    .map((value) => ({
      customizationId: value.customizationId,
      value: value.value,
    }))
    .sort((left, right) =>
      left.customizationId.localeCompare(right.customizationId),
    );
}

export function lineSignature(line: Omit<CartLine, "id" | "quantity"> | CartLine) {
  return JSON.stringify({
    dropId: line.dropId,
    dropProductId: line.dropProductId,
    productId: line.productId,
    sizeId: line.sizeId,
    customizations: canonicalCustomizations(line.customizations),
    components: [...line.components]
      .map((component) => ({
        bundleComponentId: component.bundleComponentId,
        sizeId: component.sizeId,
        customizations: canonicalCustomizations(component.customizations),
      }))
      .sort((left, right) =>
        left.bundleComponentId.localeCompare(right.bundleComponentId),
      ),
  });
}

export function calculateDiscount(
  subtotalCents: number,
  coupon: { type: "PERCENT" | "FIXED"; value: number },
) {
  const discount =
    coupon.type === "PERCENT"
      ? Math.floor((subtotalCents * coupon.value) / 100)
      : coupon.value;
  return Math.min(subtotalCents, Math.max(0, discount));
}

export type CouponRule = {
  isActive: boolean;
  archivedAt: Date | null;
  dropId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  minOrderCents: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
};

export function couponEligibilityError(
  coupon: CouponRule,
  context: { dropId: string; subtotalCents: number; now: Date },
) {
  if (!coupon.isActive || coupon.archivedAt) return "El cupón está inactivo.";
  if (coupon.dropId !== null && coupon.dropId !== context.dropId) {
    return "El cupón no es válido para este drop.";
  }
  if (coupon.startsAt && coupon.startsAt > context.now) {
    return "El cupón todavía no está activo.";
  }
  if (coupon.endsAt && coupon.endsAt <= context.now) {
    return "El cupón ha caducado.";
  }
  if (coupon.minOrderCents !== null && context.subtotalCents < coupon.minOrderCents) {
    return `El pedido mínimo para este cupón es ${(coupon.minOrderCents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}.`;
  }
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return "Este cupón ha alcanzado su límite de usos.";
  }
  return null;
}

export function isDropOpen(startsAt: Date, endsAt: Date, now: Date) {
  return startsAt <= now && endsAt > now;
}
