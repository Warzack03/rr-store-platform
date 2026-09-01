import assert from "node:assert/strict";
import test from "node:test";

import { normalizeRedirectPath } from "./redirect-domain";

test("normaliza rutas y URLs antiguas sin conservar dominio, query ni barra final", () => {
  assert.equal(normalizeRedirectPath(" /producto/camiseta/ "), "/producto/camiseta");
  assert.equal(normalizeRedirectPath("https://tienda.risingraimon.es/producto/camiseta/?ref=old"), "/producto/camiseta");
  assert.equal(normalizeRedirectPath("/"), "/");
});

test("rechaza destinos externos ambiguos y rutas no internas", () => {
  assert.equal(normalizeRedirectPath("javascript:alert(1)"), null);
  assert.equal(normalizeRedirectPath("//example.com/path"), null);
  assert.equal(normalizeRedirectPath("productos/camiseta"), null);
  assert.equal(normalizeRedirectPath("/productos?x=1"), null);
  assert.equal(normalizeRedirectPath("/productos\\admin"), null);
});
