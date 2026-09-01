import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { getPrismaClient } from "../src/server/db/client";

const prisma = getPrismaClient();

const expectedTables = [
  "AdminRecoveryCode",
  "AdminUser",
  "AuditLog",
  "BundleComponent",
  "CheckoutAttempt",
  "Coupon",
  "CouponRedemption",
  "Drop",
  "DropProduct",
  "DropProductCustomization",
  "EmailDelivery",
  "MediaAsset",
  "Order",
  "OrderAddress",
  "OrderItem",
  "OrderItemComponent",
  "OrderItemCustomization",
  "OrderStatusHistory",
  "Payment",
  "Product",
  "ProductCustomization",
  "ProductImage",
  "ProductSize",
  "Redirect",
  "Refund",
  "Shipment",
  "ShippingMethod",
  "Size",
  "SizeGuide",
  "StoreSettings",
  "StripeEvent",
].map((tableName) => tableName.toLowerCase()).sort();

const expectedChecks = [
  "chk_bundle_component_quantity",
  "chk_checkout_attempt_totals",
  "chk_coupon_dates",
  "chk_coupon_value",
  "chk_drop_dates",
  "chk_drop_product_compare_at",
  "chk_drop_published_dates",
  "chk_order_address_country",
  "chk_order_item_totals",
  "chk_order_totals",
  "chk_payment_amount",
  "chk_product_customization_config",
  "chk_redirect_status_301",
  "chk_refund_amount",
  "chk_shipment_pickup_snapshot",
  "chk_store_settings_singleton",
].sort();

class VerificationRollback extends Error {}

async function verifyStructure() {
  const tables = await prisma.$queryRaw<Array<{ tableName: string }>>`
    SELECT TABLE_NAME AS tableName
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME <> '_prisma_migrations'
  `;
  assert.deepEqual(
    tables.map(({ tableName }) => tableName.toLowerCase()).sort(),
    expectedTables,
  );

  const checks = await prisma.$queryRaw<Array<{ constraintName: string }>>`
    SELECT CONSTRAINT_NAME AS constraintName
    FROM information_schema.CHECK_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
  `;
  const checkNames = new Set(
    checks.map(({ constraintName }) => constraintName.toLowerCase()),
  );
  for (const expectedCheck of expectedChecks) {
    assert.ok(checkNames.has(expectedCheck), `Falta el check ${expectedCheck}`);
  }
}

async function verifySeed() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
  assert.equal(settings?.storeName, "Tienda Rising Raimon");

  const methods = await prisma.shippingMethod.findMany({
    orderBy: { sortOrder: "asc" },
    select: { kind: true, priceCents: true, isEnabled: true },
  });
  assert.deepEqual(methods, [
    { kind: "HOME", priceCents: 499, isEnabled: true },
    { kind: "PICKUP", priceCents: 349, isEnabled: false },
  ]);
}

async function verifyRelations() {
  const suffix = randomUUID().slice(0, 8);

  try {
    await prisma.$transaction(async (transaction) => {
      const media = await transaction.mediaAsset.create({
        data: {
          storageKey: `verification/${suffix}.webp`,
          originalName: "verification.webp",
          mimeType: "image/webp",
          byteSize: 1_024n,
          width: 100,
          height: 100,
        },
      });
      const guide = await transaction.sizeGuide.create({
        data: {
          name: `Guía ${suffix}`,
          mediaAssetId: media.id,
          altText: "Guía de verificación",
        },
      });
      const product = await transaction.product.create({
        data: {
          type: "SIMPLE",
          name: `Producto ${suffix}`,
          slug: `producto-${suffix}`,
          shortDescription: "Descripción breve",
          description: "Descripción completa",
          sizeGuideId: guide.id,
        },
      });
      const size = await transaction.size.create({
        data: { label: `TEST-${suffix}` },
      });
      await transaction.productSize.create({
        data: { productId: product.id, sizeId: size.id },
      });

      const loadedProduct = await transaction.product.findUniqueOrThrow({
        where: { id: product.id },
        include: { sizeGuide: true, sizes: { include: { size: true } } },
      });
      assert.equal(loadedProduct.sizeGuide?.id, guide.id);
      assert.equal(loadedProduct.sizes[0]?.size.label, `TEST-${suffix}`);

      throw new VerificationRollback();
    });
  } catch (error) {
    if (!(error instanceof VerificationRollback)) throw error;
  }
}

async function verifyConstraints() {
  let invalidDropRejected = false;
  try {
    const invalidDrop = await prisma.drop.create({
      data: {
        title: "Drop inválido de verificación",
        shortText: "No debe persistirse",
        startsAt: new Date("2027-02-02T00:00:00Z"),
        endsAt: new Date("2027-02-01T00:00:00Z"),
      },
    });
    await prisma.drop.delete({ where: { id: invalidDrop.id } });
  } catch {
    invalidDropRejected = true;
  }
  assert.ok(invalidDropRejected, "La BBDD aceptó un drop con fechas inválidas");

  let foreignKeyRejected = false;
  try {
    await prisma.productSize.create({
      data: { productId: "missing-product", sizeId: "missing-size" },
    });
  } catch {
    foreignKeyRejected = true;
  }
  assert.ok(foreignKeyRejected, "La BBDD aceptó referencias inexistentes");

  const label = `UNIQUE-${randomUUID().slice(0, 8)}`;
  const size = await prisma.size.create({ data: { label } });
  let uniqueRejected = false;
  try {
    await prisma.size.create({ data: { label } });
  } catch {
    uniqueRejected = true;
  } finally {
    await prisma.size.delete({ where: { id: size.id } });
  }
  assert.ok(uniqueRejected, "La BBDD aceptó una talla duplicada");
}

async function verifyDatabase() {
  await verifyStructure();
  await verifySeed();
  await verifyRelations();
  await verifyConstraints();
  console.log("Modelo, seed, relaciones y restricciones verificados.");
}

verifyDatabase()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Verificación fallida.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
