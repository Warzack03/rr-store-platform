import assert from "node:assert/strict";
import test from "node:test";

import { logNodeEgressIpDiagnostic } from "./egress-ip-diagnostic";

test("no hace ninguna consulta cuando el diagnóstico está apagado", async () => {
  let fetchCalls = 0;
  const result = await logNodeEgressIpDiagnostic({
    enabled: "false",
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response();
    },
  });

  assert.equal(result, null);
  assert.equal(fetchCalls, 0);
});

test("registra una dirección IPv4 válida sin exponer otros datos", async () => {
  const entries: unknown[][] = [];
  const result = await logNodeEgressIpDiagnostic({
    enabled: "true",
    fetchImpl: async () =>
      new Response(JSON.stringify({ ip: "203.0.113.42" }), {
        headers: { "content-type": "application/json" },
      }),
    log: (...entry) => entries.push(entry),
  });

  assert.equal(result?.status, "IP_OK");
  assert.equal(result?.status === "IP_OK" ? result.sourceIp : null, "203.0.113.42");
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.[0], "[node-egress-ip-diagnostic]");
});

test("rechaza respuestas que no contienen una IP válida", async () => {
  const result = await logNodeEgressIpDiagnostic({
    enabled: "true",
    fetchImpl: async () =>
      new Response(JSON.stringify({ ip: "not-an-ip" }), {
        headers: { "content-type": "application/json" },
      }),
    log: () => undefined,
  });

  assert.deepEqual(result?.status, "IP_ERROR");
  assert.equal(result?.status === "IP_ERROR" ? result.code : null, "INVALID_RESPONSE");
});

test("distingue un timeout de otros fallos de red", async () => {
  const timeoutError = new Error("timed out");
  timeoutError.name = "AbortError";
  const result = await logNodeEgressIpDiagnostic({
    enabled: "true",
    fetchImpl: async () => {
      throw timeoutError;
    },
    log: () => undefined,
  });

  assert.equal(result?.status === "IP_ERROR" ? result.code : null, "TIMEOUT");
});
