import assert from "node:assert/strict";
import test from "node:test";

import { checkoutCanComplete, checkoutExpiry, isPeninsularPostalCode } from "./domain";

test("acepta códigos postales peninsulares y rechaza zonas excluidas", () => {
  assert.equal(isPeninsularPostalCode("28001"), true);
  assert.equal(isPeninsularPostalCode("08001"), true);
  for (const code of ["07001", "35001", "38001", "51001", "52001", "99999", "2800"]) assert.equal(isPeninsularPostalCode(code), false);
});

test("la ventana de checkout dura treinta minutos con límite inclusivo", () => {
  const created = new Date("2026-08-25T10:00:00Z");
  const expires = checkoutExpiry(created);
  assert.equal(expires.toISOString(), "2026-08-25T10:30:00.000Z");
  assert.equal(checkoutCanComplete(expires, expires), true);
  assert.equal(checkoutCanComplete(expires, new Date(expires.valueOf() + 1)), false);
});
