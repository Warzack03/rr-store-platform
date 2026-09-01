import "dotenv/config";

import { constants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";

import type { PrismaClient } from "../src/generated/prisma/client";
import {
  checkReleaseEnvironment,
  type ReadinessFinding,
  type ReleaseTarget,
  summarizeFindings,
} from "../src/features/release/readiness";
import { getPrismaClient } from "../src/server/db/client";

const workspaceRoot = path.resolve(import.meta.dirname, "..");

function readTarget(): ReleaseTarget {
  const argument = process.argv.find((value) => value.startsWith("--target="));
  const value = argument?.split("=", 2)[1] ?? process.env.STORE_ENV;
  if (value !== "beta" && value !== "production") {
    throw new Error("Indica --target=beta o --target=production y configura ese entorno.");
  }
  return value;
}

function result(code: string, level: ReadinessFinding["level"], message: string) {
  return { code, level, message } satisfies ReadinessFinding;
}

async function checkMediaFiles(
  prisma: PrismaClient,
  mediaRoot: string,
): Promise<ReadinessFinding[]> {
  const findings: ReadinessFinding[] = [];
  try {
    await access(mediaRoot, constants.R_OK | constants.W_OK);
    findings.push(result("media-access", "ok", "El directorio de medios permite lectura y escritura."));
  } catch {
    return [
      result(
        "media-access",
        "blocker",
        "MEDIA_ROOT no existe o el proceso Node.js no puede leer y escribir en él.",
      ),
    ];
  }

  const assets = await prisma.mediaAsset.findMany({ select: { storageKey: true } });
  let missing = 0;
  for (const asset of assets) {
    const absolutePath = path.resolve(mediaRoot, ...asset.storageKey.split("/"));
    const relative = path.relative(mediaRoot, absolutePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      missing += 1;
      continue;
    }
    try {
      await access(absolutePath, constants.R_OK);
    } catch {
      missing += 1;
    }
  }

  findings.push(
    missing === 0
      ? result("media-files", "ok", `${assets.length} archivos registrados están accesibles.`)
      : result(
          "media-files",
          "blocker",
          `${missing} de ${assets.length} archivos registrados no están accesibles en MEDIA_ROOT.`,
        ),
  );
  return findings;
}

async function checkDatabase(
  prisma: PrismaClient,
  target: ReleaseTarget,
): Promise<ReadinessFinding[]> {
  const findings: ReadinessFinding[] = [];
  const [
    settings,
    shippingMethods,
    activeAdmins,
    demoProducts,
    demoDrops,
    demoCoupons,
    products,
    drops,
    redirects,
    orders,
    failedEmails,
    failedStripeEvents,
    stuckStripeEvents,
  ] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
    prisma.shippingMethod.findMany({ select: { kind: true, isEnabled: true, priceCents: true } }),
    prisma.adminUser.findMany({
      where: { isActive: true },
      select: {
        totpEnabled: true,
        recoveryCodes: { where: { usedAt: null }, select: { id: true } },
      },
    }),
    prisma.product.count({ where: { id: { startsWith: "demo_" } } }),
    prisma.drop.count({ where: { id: { startsWith: "demo_" } } }),
    prisma.coupon.count({ where: { id: { startsWith: "demo_" } } }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", archivedAt: null },
      select: {
        type: true,
        images: { select: { id: true } },
        sizes: { select: { sizeId: true } },
        bundleComponents: { select: { id: true } },
      },
    }),
    prisma.drop.findMany({
      where: { status: "PUBLISHED", archivedAt: null },
      select: {
        heroMediaId: true,
        isPrimary: true,
        dropProducts: { where: { isVisible: true }, select: { id: true } },
      },
    }),
    prisma.redirect.count(),
    prisma.order.count(),
    prisma.emailDelivery.count({ where: { status: "FAILED" } }),
    prisma.stripeEvent.count({ where: { processingStatus: "FAILED" } }),
    prisma.stripeEvent.count({
      where: {
        processingStatus: "RECEIVED",
        receivedAt: { lt: new Date(Date.now() - 10 * 60 * 1_000) },
      },
    }),
  ]);

  findings.push(
    settings
      ? result("store-settings", "ok", "Configuración pública de la tienda presente.")
      : result("store-settings", "blocker", "Falta StoreSettings; ejecuta npm run db:seed."),
  );

  const home = shippingMethods.find(({ kind }) => kind === "HOME");
  const pickup = shippingMethods.find(({ kind }) => kind === "PICKUP");
  findings.push(
    home?.isEnabled && home.priceCents > 0
      ? result("home-shipping", "ok", "Entrega a domicilio activa y con tarifa configurada.")
      : result("home-shipping", "blocker", "La entrega a domicilio debe estar activa y tener tarifa."),
  );
  if (pickup?.isEnabled) {
    findings.push(
      result(
        "pickup-disabled",
        "blocker",
        "Pickup sigue activo aunque la operativa aprobada es exclusivamente a domicilio.",
      ),
    );
  }

  const admin = activeAdmins[0];
  if (activeAdmins.length !== 1 || !admin?.totpEnabled || admin.recoveryCodes.length === 0) {
    findings.push(
      result(
        "admin",
        "blocker",
        "Debe existir un único administrador activo con TOTP y al menos un código de recuperación disponible.",
      ),
    );
  } else {
    findings.push(result("admin", "ok", "Administrador, TOTP y recuperación preparados."));
  }

  const demoRecords = demoProducts + demoDrops + demoCoupons;
  findings.push(
    demoRecords === 0
      ? result("demo-data", "ok", "No se detectan registros reservados de demostración.")
      : result(
          "demo-data",
          "blocker",
          `Se detectan ${demoRecords} registros demo; deben revisarse y retirarse antes del corte.`,
        ),
  );

  if (products.length === 0) {
    findings.push(result("catalog", "blocker", "No hay productos definitivos publicados."));
  } else {
    const withoutImages = products.filter(({ images }) => images.length === 0).length;
    const simpleWithoutSizes = products.filter(
      ({ type, sizes }) => type === "SIMPLE" && sizes.length === 0,
    ).length;
    const emptyBundles = products.filter(
      ({ type, bundleComponents }) => type === "BUNDLE" && bundleComponents.length === 0,
    ).length;
    if (withoutImages + simpleWithoutSizes + emptyBundles > 0) {
      findings.push(
        result(
          "catalog",
          "blocker",
          `Catálogo incompleto: ${withoutImages} sin imágenes, ${simpleWithoutSizes} simples sin tallas y ${emptyBundles} packs sin componentes.`,
        ),
      );
    } else {
      findings.push(result("catalog", "ok", `${products.length} productos publicados completos.`));
    }
  }

  if (drops.length === 0) {
    findings.push(result("drops", "blocker", "No hay ningún drop definitivo publicado."));
  } else {
    const missingHero = drops.filter(({ heroMediaId }) => !heroMediaId).length;
    const emptyDrops = drops.filter(({ dropProducts }) => dropProducts.length === 0).length;
    if (missingHero + emptyDrops > 0) {
      findings.push(
        result(
          "drops",
          "blocker",
          `Drops incompletos: ${missingHero} sin hero y ${emptyDrops} sin productos visibles.`,
        ),
      );
    } else {
      findings.push(result("drops", "ok", `${drops.length} drops publicados completos.`));
    }
    if (!drops.some(({ isPrimary }) => isPrimary)) {
      findings.push(result("primary-drop", "warning", "Ningún drop publicado está marcado como principal."));
    }
  }

  if (redirects === 0) {
    findings.push(
      result("redirects", "warning", "No hay redirects 301; confirma que el inventario WooCommerce no los necesita."),
    );
  } else {
    findings.push(result("redirects", "ok", `${redirects} redirects 301 preparados.`));
  }
  if (target === "production" && orders > 0) {
    findings.push(
      result(
        "existing-orders",
        "warning",
        `La base de producción ya contiene ${orders} pedidos; concílialos antes del corte.`,
      ),
    );
  }
  if (failedEmails > 0) {
    findings.push(result("failed-emails", "warning", `Hay ${failedEmails} correos fallidos pendientes de revisar.`));
  }
  if (failedStripeEvents + stuckStripeEvents > 0) {
    findings.push(
      result(
        "stripe-events",
        "blocker",
        `Hay ${failedStripeEvents} eventos Stripe fallidos y ${stuckStripeEvents} pendientes durante más de 10 minutos.`,
      ),
    );
  }

  return findings;
}

function printFindings(findings: ReadinessFinding[]) {
  const labels = { blocker: "BLOQUEO", warning: "AVISO", ok: "OK" } as const;
  for (const item of findings) console.log(`[${labels[item.level]}] ${item.message}`);
  const summary = summarizeFindings(findings);
  console.log(`\nResultado: ${summary.blocker} bloqueos, ${summary.warning} avisos y ${summary.ok} comprobaciones correctas.`);
  if (summary.blocker === 0) console.log("El preflight automático está superado; completa las validaciones manuales del runbook.");
}

async function main() {
  const target = readTarget();
  const dataOnly = process.argv.includes("--data-only");
  const findings = dataOnly
    ? []
    : checkReleaseEnvironment({ values: process.env, target, workspaceRoot });
  const envOnly = process.argv.includes("--env-only");
  const environmentHasBlockers = summarizeFindings(findings).blocker > 0;

  if (!envOnly && (dataOnly || !environmentHasBlockers)) {
    const prisma = getPrismaClient();
    try {
      findings.push(...(await checkDatabase(prisma, target)));
      if (process.env.MEDIA_ROOT) {
        findings.push(...(await checkMediaFiles(prisma, path.resolve(process.env.MEDIA_ROOT))));
      } else {
        findings.push(result("media-root", "blocker", "MEDIA_ROOT no está configurado."));
      }
    } catch {
      findings.push(
        result(
          "database-connect",
          "blocker",
          "No se ha podido completar la auditoría de base de datos y medios.",
        ),
      );
    } finally {
      await prisma.$disconnect();
    }
  } else if (!envOnly) {
    findings.push(
      result(
        "database-skipped",
        "warning",
        "Se omite la auditoría de datos hasta corregir los bloqueos de entorno.",
      ),
    );
  }

  printFindings(findings);
  if (summarizeFindings(findings).blocker > 0) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "No se ha podido ejecutar el preflight.");
  process.exitCode = 1;
});
