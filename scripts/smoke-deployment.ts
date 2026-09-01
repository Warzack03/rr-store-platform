import "dotenv/config";

type SmokeTarget = "local" | "beta" | "production";

type CheckResult = {
  ok: boolean;
  message: string;
};

const publicPaths = [
  "/",
  "/productos",
  "/aviso-legal",
  "/privacidad",
  "/cookies",
  "/condiciones-de-compra",
  "/envios",
  "/cambios-y-devoluciones",
];

function readOption(name: string) {
  return process.argv.find((value) => value.startsWith(`${name}=`))?.split("=", 2)[1];
}

function readConfiguration() {
  const positionalUrl = process.argv.slice(2).find((value) => !value.startsWith("--"));
  const rawUrl = positionalUrl ?? process.env.SMOKE_BASE_URL;
  if (!rawUrl) throw new Error("Indica la URL: npm run smoke -- https://dominio --target=beta|production");
  const baseUrl = new URL(rawUrl);
  if (baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("La URL del smoke test debe contener solo el origen, sin ruta ni parámetros.");
  }
  const target = readOption("--target") ?? process.env.STORE_ENV ?? "local";
  if (target !== "local" && target !== "beta" && target !== "production") {
    throw new Error("El target debe ser local, beta o production.");
  }
  if (target !== "local" && baseUrl.protocol !== "https:") {
    throw new Error("Beta y producción deben comprobarse mediante HTTPS.");
  }
  return { baseUrl, target: target as SmokeTarget };
}

function authorizationHeaders(): HeadersInit | undefined {
  const user = process.env.SMOKE_BASIC_AUTH_USER;
  const password = process.env.SMOKE_BASIC_AUTH_PASSWORD;
  if (!user && !password) return undefined;
  if (!user || !password) throw new Error("Configura juntas SMOKE_BASIC_AUTH_USER y SMOKE_BASIC_AUTH_PASSWORD.");
  return { Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}` };
}

async function request(baseUrl: URL, pathname: string, redirect: RequestRedirect = "follow") {
  return fetch(new URL(pathname, baseUrl), {
    headers: authorizationHeaders(),
    redirect,
    signal: AbortSignal.timeout(15_000),
  });
}

function success(message: string): CheckResult {
  return { ok: true, message };
}

function failure(message: string): CheckResult {
  return { ok: false, message };
}

async function main() {
  const { baseUrl, target } = readConfiguration();
  const checks: CheckResult[] = [];

  const health = await request(baseUrl, "/api/health");
  const healthBody = (await health.json().catch(() => null)) as {
    status?: string;
    checks?: { database?: string };
  } | null;
  checks.push(
    health.status === 200 && healthBody?.status === "ok" && healthBody.checks?.database === "ok"
      ? success("Health y base de datos responden correctamente.")
      : failure(`Health no está listo (HTTP ${health.status}).`),
  );

  for (const pathname of publicPaths) {
    const response = await request(baseUrl, pathname);
    checks.push(
      response.status === 200
        ? success(`${pathname} responde 200.`)
        : failure(`${pathname} responde HTTP ${response.status}.`),
    );
    if (pathname === "/") {
      const requiredHeaders = [
        "content-security-policy",
        "referrer-policy",
        "x-content-type-options",
        "x-frame-options",
      ];
      const missing = requiredHeaders.filter((header) => !response.headers.has(header));
      checks.push(
        missing.length === 0
          ? success("Cabeceras de seguridad principales presentes.")
          : failure(`Faltan cabeceras de seguridad: ${missing.join(", ")}.`),
      );
      if (target === "production") {
        checks.push(
          response.headers.has("strict-transport-security")
            ? success("HSTS está activo en producción.")
            : failure("Falta HSTS en producción."),
        );
      }
      const html = await response.text();
      checks.push(
        html.includes(`rel="canonical" href="${baseUrl.origin}`)
          ? success("Canonical usa el origen comprobado.")
          : failure("Canonical no coincide con el origen comprobado."),
      );
    }
  }

  const robots = await request(baseUrl, "/robots.txt");
  const robotsBody = await robots.text();
  const robotsCorrect =
    target === "production"
      ? robots.status === 200 && robotsBody.includes(`Sitemap: ${baseUrl.origin}/sitemap.xml`) && !robotsBody.includes("Disallow: /\n")
      : robots.status === 200 && robotsBody.includes("Disallow: /");
  checks.push(
    robotsCorrect
      ? success(`robots.txt es correcto para ${target}.`)
      : failure(`robots.txt no corresponde al entorno ${target}.`),
  );

  if (target === "production") {
    const sitemap = await request(baseUrl, "/sitemap.xml");
    const body = await sitemap.text();
    checks.push(
      sitemap.status === 200 && body.includes("<urlset") && body.includes(baseUrl.origin)
        ? success("Sitemap de producción publicado con el dominio correcto.")
        : failure("El sitemap de producción está vacío o usa otro dominio."),
    );
  }

  const admin = await request(baseUrl, "/admin", "manual");
  checks.push(
    admin.status >= 300 && admin.status < 400
      ? success("El backoffice exige autenticación.")
      : failure(`El backoffice no redirige al acceso (HTTP ${admin.status}).`),
  );

  for (const check of checks) console.log(`[${check.ok ? "OK" : "FALLO"}] ${check.message}`);
  const failures = checks.filter(({ ok }) => !ok).length;
  console.log(`\nResultado: ${checks.length - failures}/${checks.length} comprobaciones correctas.`);
  if (failures > 0) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "No se ha podido ejecutar el smoke test.");
  process.exitCode = 1;
});
