import assert from "node:assert/strict";
import test from "node:test";

import { renderOrderEmail, type EmailOrder } from "./domain";

const order: EmailOrder = {
  number: 7,
  publicToken: "token-privado-largo",
  status: "RECEIVED",
  firstName: "Aarón <script>",
  lastName: "Blanco",
  email: "buyer@example.com",
  phone: "600000000",
  subtotalCents: 5_980,
  discountCents: 0,
  shippingCents: 499,
  totalCents: 6_479,
  items: [{ productNameSnapshot: "Camiseta", sizeLabelSnapshot: "M", quantity: 1, lineTotalCents: 5_980, customizations: [{ labelSnapshot: "Nombre", valueSnapshot: "RAIMON" }], components: [] }],
  address: { postalCode: "28047", province: "Madrid", city: "Madrid", street: "Calle Mayor", streetNumber: "1", additionalLine: null },
  shipment: { trackingNumber: null, trackingUrl: null },
  payment: { status: "PAID" },
};
const settings = { storeName: "Rising Raimon", supportEmail: "soporte@example.com", deliveryEstimateText: "Entrega tras fabricación." };

test("el correo recibido contiene pedido, productos, envío, total y enlace privado", () => {
  const result = renderOrderEmail("ORDER_RECEIVED", order, settings, "https://tienda.example.com/");
  assert.match(result.subject, /#7/);
  assert.match(result.text, /Camiseta/);
  assert.match(result.text, /6\.479|64,79/);
  assert.match(result.text, /pedido\/token-privado-largo/);
  assert.match(result.html, /Aarón &lt;script&gt;/);
  assert.doesNotMatch(result.html, /Aarón <script>/);
});

test("el correo enviado funciona sin tracking y añade el enlace cuando existe", () => {
  const withoutTracking = renderOrderEmail("ORDER_SHIPPED", order, settings, "https://tienda.example.com");
  assert.doesNotMatch(withoutTracking.html, /Ver seguimiento/);
  const withTracking = renderOrderEmail("ORDER_SHIPPED", { ...order, shipment: { trackingNumber: "TEST-1", trackingUrl: "https://tracking.example.com/TEST-1" } }, settings, "https://tienda.example.com");
  assert.match(withTracking.text, /TEST-1/);
  assert.match(withTracking.html, /Ver seguimiento/);
});
