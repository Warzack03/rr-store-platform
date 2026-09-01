import assert from "node:assert/strict";
import test from "node:test";

import {
  checkReleaseEnvironment,
  summarizeFindings,
} from "./readiness";

const validProduction = {
  STORE_ENV: "production",
  SITE_URL: "https://tienda.risingraimon.es",
  AUTH_SECRET: "a-secure-random-production-secret-with-64-characters-123456789",
  DATABASE_URL: "mysql://store:secret@mysql.hostinger.internal:3306/rr_store_prod",
  MEDIA_ROOT: "/home/store/persistent/media-production",
  GOOGLE_SITE_VERIFICATION: "google-verification-token",
  STRIPE_SECRET_KEY: "sk_live_51ProductionKeyForReadinessChecks",
  STRIPE_WEBHOOK_SECRET: "whsec_release-check",
  SMTP_HOST: "smtp.hostinger.com",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_USER: "tienda@risingraimon.es",
  SMTP_PASSWORD: "smtp-secret",
  SMTP_FROM_EMAIL: "tienda@risingraimon.es",
};

test("acepta una configuración de producción completa", () => {
  const findings = checkReleaseEnvironment({
    values: validProduction,
    target: "production",
    workspaceRoot: "/home/store/app",
  });

  assert.equal(summarizeFindings(findings).blocker, 0);
});

test("rechaza valores propios del entorno local en producción", () => {
  const findings = checkReleaseEnvironment({
    values: {
      ...validProduction,
      SITE_URL: "http://localhost:3000",
      DATABASE_URL: "mysql://store:secret@127.0.0.1:3306/rr_store_local",
      STRIPE_SECRET_KEY: "sk_test_local",
    },
    target: "production",
    workspaceRoot: "/home/store/app",
  });
  const codes = new Set(
    findings.filter(({ level }) => level === "blocker").map(({ code }) => code),
  );

  assert.ok(codes.has("site-url"));
  assert.ok(codes.has("database-name"));
  assert.ok(codes.has("stripe-key"));
  assert.ok(findings.some(({ code, level }) => code === "database-host" && level === "warning"));
});

test("rechaza medios dentro de la carpeta sustituida al desplegar", () => {
  const findings = checkReleaseEnvironment({
    values: { ...validProduction, MEDIA_ROOT: "/home/store/app/uploads" },
    target: "production",
    workspaceRoot: "/home/store/app",
  });

  assert.ok(findings.some(({ code, level }) => code === "media-location" && level === "blocker"));
});

test("beta exige Stripe test y no obliga a configurar Search Console", () => {
  const findings = checkReleaseEnvironment({
    values: {
      ...validProduction,
      STORE_ENV: "beta",
      SITE_URL: "https://tienda-beta.risingraimon.es",
      DATABASE_URL: "mysql://store:secret@mysql.hostinger.internal:3306/rr_store_beta",
      STRIPE_SECRET_KEY: "sk_test_beta-secret",
      GOOGLE_SITE_VERIFICATION: undefined,
    },
    target: "beta",
    workspaceRoot: "/home/store/app",
  });

  assert.equal(summarizeFindings(findings).blocker, 0);
});

test("impide conservar las credenciales de alta inicial", () => {
  const findings = checkReleaseEnvironment({
    values: { ...validProduction, ADMIN_INITIAL_PASSWORD: "temporary-password" },
    target: "production",
    workspaceRoot: "/home/store/app",
  });

  assert.ok(findings.some(({ code, level }) => code === "initial-admin-values" && level === "blocker"));
});
