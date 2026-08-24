import assert from "node:assert/strict";
import test from "node:test";

import { clearRateLimit, consumeRateLimit } from "./rate-limit";

test("bloquea un identificador al alcanzar el límite", () => {
  const scope = `test-${Date.now()}`;
  assert.equal(consumeRateLimit(scope, "admin", 2), true);
  assert.equal(consumeRateLimit(scope, "admin", 2), true);
  assert.equal(consumeRateLimit(scope, "admin", 2), false);
  clearRateLimit(scope, "admin");
});

test("aísla intentos por ámbito e identificador", () => {
  const scope = `test-${Date.now()}-isolated`;
  assert.equal(consumeRateLimit(scope, "one", 1), true);
  assert.equal(consumeRateLimit(scope, "one", 1), false);
  assert.equal(consumeRateLimit(scope, "two", 1), true);
  assert.equal(consumeRateLimit(`${scope}-other`, "one", 1), true);
});

test("abre una ventana nueva cuando la anterior ha caducado", async () => {
  const scope = `test-${Date.now()}-expiry`;
  assert.equal(consumeRateLimit(scope, "admin", 1, 1), true);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(consumeRateLimit(scope, "admin", 1, 1), true);
});
