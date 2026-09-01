import path from "node:path";

export type ReleaseTarget = "beta" | "production";
export type ReadinessLevel = "blocker" | "warning" | "ok";

export type ReadinessFinding = {
  code: string;
  level: ReadinessLevel;
  message: string;
};

type EnvironmentValues = Record<string, string | undefined>;

type EnvironmentCheckOptions = {
  values: EnvironmentValues;
  target: ReleaseTarget;
  workspaceRoot: string;
};

const expectedOrigins: Record<ReleaseTarget, string> = {
  beta: "https://tienda-beta.risingraimon.es",
  production: "https://tienda.risingraimon.es",
};

const placeholderPattern = /(replace|change-me|example|changeme|your-|pon-aqui)/i;

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function finding(
  code: string,
  level: ReadinessLevel,
  message: string,
): ReadinessFinding {
  return { code, level, message };
}

function isInside(parent: string, candidate: string) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function checkReleaseEnvironment({
  values,
  target,
  workspaceRoot,
}: EnvironmentCheckOptions): ReadinessFinding[] {
  const findings: ReadinessFinding[] = [];
  const expectedOrigin = expectedOrigins[target];

  if (values.STORE_ENV !== target) {
    findings.push(
      finding(
        "environment",
        "blocker",
        `STORE_ENV debe ser ${target} para validar este entorno.`,
      ),
    );
  } else {
    findings.push(finding("environment", "ok", `Entorno ${target} seleccionado.`));
  }

  let siteUrl: URL | null = null;
  try {
    siteUrl = new URL(values.SITE_URL ?? "");
  } catch {
    // Se informa con un mensaje operativo debajo.
  }
  if (!siteUrl || siteUrl.origin !== expectedOrigin || siteUrl.href !== `${expectedOrigin}/`) {
    findings.push(
      finding(
        "site-url",
        "blocker",
        `SITE_URL debe ser exactamente ${expectedOrigin}.`,
      ),
    );
  } else {
    findings.push(finding("site-url", "ok", "Origen canónico HTTPS correcto."));
  }

  const authSecret = values.AUTH_SECRET?.trim() ?? "";
  if (authSecret.length < 32 || placeholderPattern.test(authSecret)) {
    findings.push(
      finding(
        "auth-secret",
        "blocker",
        "AUTH_SECRET debe ser aleatorio, exclusivo del entorno y tener al menos 32 caracteres.",
      ),
    );
  } else {
    findings.push(finding("auth-secret", "ok", "Secreto de autenticación presente."));
  }

  let databaseUrl: URL | null = null;
  try {
    databaseUrl = new URL(values.DATABASE_URL ?? "");
  } catch {
    // Se informa con un mensaje operativo debajo.
  }
  const localDatabaseHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!databaseUrl || databaseUrl.protocol !== "mysql:") {
    findings.push(
      finding("database-url", "blocker", "DATABASE_URL debe ser una URL MySQL válida."),
    );
  } else {
    const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, ""));
    const wrongEnvironmentName =
      target === "production"
        ? /(local|test|shadow|demo|beta)/i.test(databaseName)
        : /(prod|production)/i.test(databaseName);
    if (!databaseName || wrongEnvironmentName) {
      findings.push(
        finding(
          "database-name",
          "blocker",
          "El nombre de la base parece pertenecer a otro entorno; usa una BBDD exclusiva.",
        ),
      );
    } else {
      findings.push(finding("database-url", "ok", "Base de datos del entorno configurada."));
    }
  }
  if (databaseUrl && localDatabaseHosts.has(databaseUrl.hostname)) {
    findings.push(
      finding(
        "database-host",
        "warning",
        "MySQL usa loopback; es válido si aplicación y BBDD comparten hosting, pero confirma que la base es exclusiva del entorno.",
      ),
    );
  }
  if (hasValue(values.SHADOW_DATABASE_URL)) {
    findings.push(
      finding(
        "shadow-database",
        "warning",
        "SHADOW_DATABASE_URL no es necesaria en beta/producción y conviene retirarla del entorno desplegado.",
      ),
    );
  }

  const mediaRoot = values.MEDIA_ROOT?.trim() ?? "";
  if (!mediaRoot || !path.isAbsolute(mediaRoot)) {
    findings.push(
      finding(
        "media-root",
        "blocker",
        "MEDIA_ROOT debe ser una ruta absoluta del almacenamiento persistente.",
      ),
    );
  } else if (isInside(workspaceRoot, mediaRoot)) {
    findings.push(
      finding(
        "media-location",
        "blocker",
        "MEDIA_ROOT está dentro del directorio desplegable y podría perderse en un release.",
      ),
    );
  } else {
    findings.push(finding("media-root", "ok", "Ruta de medios externa al despliegue."));
  }

  const stripeKey = values.STRIPE_SECRET_KEY?.trim() ?? "";
  const expectedStripePrefix = target === "production" ? "sk_live_" : "sk_test_";
  if (!stripeKey.startsWith(expectedStripePrefix) || placeholderPattern.test(stripeKey)) {
    findings.push(
      finding(
        "stripe-key",
        "blocker",
        `STRIPE_SECRET_KEY debe usar una clave ${expectedStripePrefix}… para ${target}.`,
      ),
    );
  } else {
    findings.push(finding("stripe-key", "ok", "Modo de Stripe coherente con el entorno."));
  }
  if (!values.STRIPE_WEBHOOK_SECRET?.trim().startsWith("whsec_")) {
    findings.push(
      finding(
        "stripe-webhook",
        "blocker",
        "Falta un STRIPE_WEBHOOK_SECRET válido para el endpoint de este entorno.",
      ),
    );
  } else {
    findings.push(finding("stripe-webhook", "ok", "Secreto del webhook presente."));
  }

  const smtpRequired = [
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM_EMAIL",
  ] as const;
  const missingSmtp = smtpRequired.filter((key) => !hasValue(values[key]));
  const smtpPort = Number(values.SMTP_PORT ?? "465");
  if (missingSmtp.length > 0 || !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65_535) {
    findings.push(
      finding(
        "smtp",
        "blocker",
        "La configuración SMTP está incompleta o contiene un puerto inválido.",
      ),
    );
  } else {
    findings.push(finding("smtp", "ok", "Configuración SMTP completa."));
  }
  const fromEmail = values.SMTP_FROM_EMAIL?.trim().toLowerCase() ?? "";
  if (fromEmail && !fromEmail.endsWith("@risingraimon.es")) {
    findings.push(
      finding(
        "smtp-domain",
        "warning",
        "El remitente SMTP no usa el dominio risingraimon.es; confirma SPF, DKIM y la identidad final.",
      ),
    );
  }

  if (target === "production" && !hasValue(values.GOOGLE_SITE_VERIFICATION)) {
    findings.push(
      finding(
        "search-console",
        "blocker",
        "Falta GOOGLE_SITE_VERIFICATION para verificar Search Console antes del corte.",
      ),
    );
  }

  if (hasValue(values.ADMIN_INITIAL_EMAIL) || hasValue(values.ADMIN_INITIAL_PASSWORD)) {
    findings.push(
      finding(
        "initial-admin-values",
        "blocker",
        "Retira ADMIN_INITIAL_EMAIL y ADMIN_INITIAL_PASSWORD después de crear el administrador.",
      ),
    );
  }

  if (values.DB_IP_DIAGNOSTIC === "true") {
    findings.push(
      finding(
        "db-ip-diagnostic",
        "blocker",
        "DB_IP_DIAGNOSTIC sigue activo; apágalo y vuelve a desplegar antes de abrir la tienda.",
      ),
    );
  }

  return findings;
}

export function summarizeFindings(findings: ReadinessFinding[]) {
  return findings.reduce(
    (summary, item) => {
      summary[item.level] += 1;
      return summary;
    },
    { blocker: 0, warning: 0, ok: 0 },
  );
}
