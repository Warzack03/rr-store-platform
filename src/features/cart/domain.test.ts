import assert from "node:assert/strict";
import test from "node:test";

import { calculateDiscount, clampQuantity, couponEligibilityError, createCartLineId, isDropOpen, isValidDorsal, lineSignature, normalizeDorsal, normalizeName, type CartLine, type CouponRule } from "./domain";

const baseLine: CartLine = { id: "line-1", dropId: "drop-1", dropProductId: "drop-product-1", productId: "product-1", quantity: 1, sizeId: "size-m", customizations: [], components: [] };

test("normaliza nombres con espacios y acentos, sin perder caracteres", () => {
  assert.equal(normalizeName("  álvaro   muñoz  "), "ÁLVARO MUÑOZ");
});

test("normaliza y valida dorsales de dos cifras y sus límites", () => {
  assert.equal(normalizeDorsal("nº 123"), "12");
  assert.equal(isValidDorsal("00"), true);
  assert.equal(isValidDorsal("99"), true);
  assert.equal(isValidDorsal("9"), false);
  assert.equal(isValidDorsal("09", 10, 50), false);
  assert.equal(isValidDorsal("51", 10, 50), false);
});

test("limita la cantidad de cada línea", () => {
  assert.equal(clampQuantity(-2), 1);
  assert.equal(clampQuantity(4.9), 4);
  assert.equal(clampQuantity(200), 20);
});

test("genera identificadores de carrito compatibles con el cliente", () => {
  const first = createCartLineId();
  const second = createCartLineId();
  assert.ok(first.length > 10 && first.length <= 100);
  assert.notEqual(first, second);
});

test("fusiona solo configuraciones idénticas sin depender del orden", () => {
  const first = { ...baseLine, customizations: [{ customizationId: "number", value: "10" }, { customizationId: "name", value: "RAIMON" }] };
  const reordered = { ...first, id: "line-2", quantity: 3, customizations: [...first.customizations].reverse() };
  assert.equal(lineSignature(first), lineSignature(reordered));
  assert.notEqual(lineSignature(first), lineSignature({ ...first, sizeId: "size-l" }));
});

test("calcula descuentos porcentuales y fijos en céntimos sin superar el total", () => {
  assert.equal(calculateDiscount(9_999, { type: "PERCENT", value: 15 }), 1_499);
  assert.equal(calculateDiscount(9_999, { type: "FIXED", value: 2_000 }), 2_000);
  assert.equal(calculateDiscount(1_000, { type: "FIXED", value: 2_000 }), 1_000);
});

test("valida ámbito, fechas, mínimo y límite de usos de los cupones", () => {
  const now = new Date("2026-09-04T12:00:00.000Z");
  const base: CouponRule = { isActive: true, archivedAt: null, dropId: null, startsAt: null, endsAt: null, minOrderCents: null, maxRedemptions: null, redemptionCount: 0 };
  const context = { dropId: "drop-1", subtotalCents: 5_000, now };
  assert.equal(couponEligibilityError(base, context), null);
  assert.match(couponEligibilityError({ ...base, isActive: false }, context) ?? "", /inactivo/);
  assert.match(couponEligibilityError({ ...base, dropId: "drop-2" }, context) ?? "", /drop/);
  assert.match(couponEligibilityError({ ...base, startsAt: new Date("2026-09-05T00:00:00Z") }, context) ?? "", /todavía/);
  assert.match(couponEligibilityError({ ...base, endsAt: now }, context) ?? "", /caducado/);
  assert.match(couponEligibilityError({ ...base, minOrderCents: 5_001 }, context) ?? "", /mínimo/);
  assert.match(couponEligibilityError({ ...base, maxRedemptions: 2, redemptionCount: 2 }, context) ?? "", /límite/);
});

test("el drop deja de estar disponible exactamente en su cierre", () => {
  const startsAt = new Date("2026-09-01T10:00:00Z");
  const endsAt = new Date("2026-09-08T10:00:00Z");
  assert.equal(isDropOpen(startsAt, endsAt, startsAt), true);
  assert.equal(isDropOpen(startsAt, endsAt, new Date(endsAt.valueOf() - 1)), true);
  assert.equal(isDropOpen(startsAt, endsAt, endsAt), false);
});
