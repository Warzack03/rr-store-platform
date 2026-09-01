import { isIP } from "node:net";

const diagnosticVersion = 3;
const diagnosticUrl = "https://api.ipify.org?format=json";
const diagnosticTimeoutMs = 3_000;
const diagnosticLogPrefix = "[node-egress-ip-diagnostic]";

export type EgressIpDiagnosticResult =
  | {
      status: "IP_OK";
      sourceIp: string;
      durationMs: number;
    }
  | {
      status: "IP_ERROR";
      code: "HTTP_ERROR" | "INVALID_RESPONSE" | "LOOKUP_FAILED" | "TIMEOUT";
      durationMs: number;
    };

type DiagnosticOptions = {
  enabled?: string;
  fetchImpl?: typeof fetch;
  log?: (prefix: string, result: { diagnosticVersion: number } & EgressIpDiagnosticResult) => void;
  now?: () => number;
};

function getFailureCode(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "TIMEOUT" as const;
  }

  return "LOOKUP_FAILED" as const;
}

export async function logNodeEgressIpDiagnostic(
  options: DiagnosticOptions = {},
): Promise<EgressIpDiagnosticResult | null> {
  if ((options.enabled ?? process.env.DB_IP_DIAGNOSTIC) !== "true") {
    return null;
  }

  const now = options.now ?? Date.now;
  const startedAt = now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), diagnosticTimeoutMs);
  let result: EgressIpDiagnosticResult;

  try {
    const response = await (options.fetchImpl ?? fetch)(diagnosticUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      result = {
        status: "IP_ERROR",
        code: "HTTP_ERROR",
        durationMs: now() - startedAt,
      };
    } else {
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      const sourceIp =
        payload &&
        typeof payload === "object" &&
        "ip" in payload &&
        typeof payload.ip === "string" &&
        isIP(payload.ip)
          ? payload.ip
          : null;

      result = sourceIp
        ? {
            status: "IP_OK",
            sourceIp,
            durationMs: now() - startedAt,
          }
        : {
            status: "IP_ERROR",
            code: "INVALID_RESPONSE",
            durationMs: now() - startedAt,
          };
    }
  } catch (error) {
    result = {
      status: "IP_ERROR",
      code: getFailureCode(error),
      durationMs: now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }

  (options.log ?? console.info)(diagnosticLogPrefix, {
    diagnosticVersion,
    ...result,
  });
  return result;
}
