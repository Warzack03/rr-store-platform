import assert from "node:assert/strict";
import test from "node:test";

import {
  buildManufacturingCsv,
  buildManufacturingRows,
  canTransitionOrder,
  paymentStatusAfterRefunds,
  refundStatusFromStripe,
} from "./domain";

test("solo permite el flujo operativo definido", () => {
  assert.equal(canTransitionOrder("RECEIVED", "IN_PRODUCTION"), true);
  assert.equal(canTransitionOrder("IN_PRODUCTION", "SHIPPED"), true);
  assert.equal(canTransitionOrder("SHIPPED", "DELIVERED"), true);
  assert.equal(canTransitionOrder("DELIVERED", "SHIPPED"), false);
  assert.equal(canTransitionOrder("CANCELLED", "RECEIVED"), false);
});

test("calcula el estado financiero usando solo reembolsos confirmados", () => {
  assert.equal(paymentStatusAfterRefunds(10_000, [{ amountCents: 3_000, status: "PENDING" }]), "PAID");
  assert.equal(paymentStatusAfterRefunds(10_000, [{ amountCents: 3_000, status: "SUCCEEDED" }]), "PARTIALLY_REFUNDED");
  assert.equal(paymentStatusAfterRefunds(10_000, [{ amountCents: 10_000, status: "SUCCEEDED" }]), "REFUNDED");
  assert.equal(refundStatusFromStripe("requires_action"), "PENDING");
  assert.equal(refundStatusFromStripe("canceled"), "CANCELLED");
});

test("exporta una fila por prenda y respeta cantidades de packs flexibles", () => {
  const orders = [{
    number: 12,
    items: [{
      productNameSnapshot: "Pack partido",
      sizeLabelSnapshot: null,
      quantity: 2,
      customizations: [],
      components: [{
        componentLabelSnapshot: "Producto 1",
        productNameSnapshot: "Camiseta local",
        sizeLabelSnapshot: "M",
        quantitySnapshot: 2,
        customizations: [
          { type: "NAME" as const, valueSnapshot: "=AARON" },
          { type: "NUMBER" as const, valueSnapshot: "10" },
        ],
      }],
    }],
  }];
  assert.deepEqual(buildManufacturingRows(orders)[0], {
    reference: "#12",
    orderedProduct: "Pack partido",
    component: "Producto 1",
    manufacturingProduct: "Camiseta local",
    quantity: 4,
    size: "M",
    name: "=AARON",
    number: "10",
  });
  const csv = buildManufacturingCsv(orders);
  assert.match(csv, /^\uFEFF/);
  assert.match(csv, /"'=AARON"/);
  assert.doesNotMatch(csv, /email|teléfono|dirección/i);
});
