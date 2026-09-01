import { createConnection, isIP } from "node:net";

const diagnosticVersion = 3;
const diagnosticUrl = "https://api.ipify.org?format=json";
const diagnosticTimeoutMs = 3_000;
const diagnosticLogPrefix = "[node-egress-ip-diagnostic]";
const tcpDiagnosticTimeoutMs = 3_000;

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

type TcpEgressResult = {
  status: "TCP_OK" | "TCP_ERROR" | "TCP_SKIPPED";
  localIp?: string;
  remoteHost?: string;
  remotePort?: number;
  code?: "TIMEOUT" | "CONNECT_ERROR" | "INVALID_DATABASE_URL";
  durationMs: number;
};

async function probeMysqlTcpEgress(): Promise<TcpEgressResult> {
  const startedAt = Date.now();
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return { status: "TCP_SKIPPED", code: "INVALID_DATABASE_URL", durationMs: 0 };
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(rawUrl);
  } catch {
    return { status: "TCP_SKIPPED", code: "INVALID_DATABASE_URL", durationMs: Date.now() - startedAt };
  }

  const host = databaseUrl.hostname;
  const port = Number(databaseUrl.port || 3306);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { status: "TCP_SKIPPED", code: "INVALID_DATABASE_URL", durationMs: Date.now() - startedAt };
  }

  return new Promise((resolve) => {
    let settled = false;
    const socket = createConnection({ host, port });
    const finish = (result: TcpEgressResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.destroy();
      resolve(result);
    };
    const timeout = setTimeout(() =>
      finish({ status: "TCP_ERROR", remoteHost: host, remotePort: port, code: "TIMEOUT", durationMs: Date.now() - startedAt }),
      tcpDiagnosticTimeoutMs,
    );
    socket.once("connect", () =>
      finish({ status: "TCP_OK", localIp: socket.localAddress, remoteHost: host, remotePort: port, durationMs: Date.now() - startedAt }),
    );
    socket.once("error", () =>
      finish({ status: "TCP_ERROR", localIp: socket.localAddress, remoteHost: host, remotePort: port, code: "CONNECT_ERROR", durationMs: Date.now() - startedAt }),
    );
  });
}

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
    mysqlTcp: await probeMysqlTcpEgress(),
  });
  return result;
}
