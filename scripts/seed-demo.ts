import "dotenv/config";

import { getPrismaClient } from "../src/server/db/client";
import { demoIds, requireLocalDemoEnvironment } from "./demo-data";

const prisma = getPrismaClient();
const day = 24 * 60 * 60 * 1_000;

async function seedDemo() {
  requireLocalDemoEnvironment();
  const now = new Date();
  const dates = {
    activeStart: new Date(now.valueOf() - 2 * day),
    activeEnd: new Date(now.valueOf() + 21 * day),
    upcomingStart: new Date(now.valueOf() + 30 * day),
    upcomingEnd: new Date(now.valueOf() + 45 * day),
    endedStart: new Date(now.valueOf() - 45 * day),
    endedEnd: new Date(now.valueOf() - 15 * day),
  };

  const sizes = new Map<string, string>();
  for (const [sortOrder, label] of ["XS", "S", "M", "L", "XL", "Única"].entries()) {
    const size = await prisma.size.upsert({
      where: { label },
      update: { sortOrder, isActive: true },
      create: { label, sortOrder, isActive: true },
    });
    sizes.set(label, size.id);
  }

  const products = [
    {
      id: demoIds.products[0],
      type: "SIMPLE" as const,
      name: "Camiseta Local · Demo",
      slug: "demo-camiseta-local",
      shortDescription: "Camiseta de juego local preparada para probar tallas, nombre y dorsal.",
      description: "Producto de demostración para validar el catálogo y el carrito. No corresponde a una prenda definitiva.",
      seoTitle: "Camiseta local de demostración",
      seoDescription: "Producto de prueba de la tienda Rising Raimon.",
    },
    {
      id: demoIds.products[1],
      type: "SIMPLE" as const,
      name: "Pantalón Local · Demo",
      slug: "demo-pantalon-local",
      shortDescription: "Pantalón de juego para probar productos sin personalización.",
      description: "Producto de demostración para validar tallas, precios y combinaciones de carrito.",
      seoTitle: "Pantalón local de demostración",
      seoDescription: "Producto de prueba de la tienda Rising Raimon.",
    },
    {
      id: demoIds.products[2],
      type: "SIMPLE" as const,
      name: "Bufanda Rising · Demo",
      slug: "demo-bufanda-rising",
      shortDescription: "Accesorio de talla única con personalización opcional.",
      description: "Producto de demostración para comprobar accesorios y personalizaciones fuera de una equipación.",
      seoTitle: "Bufanda de demostración",
      seoDescription: "Producto de prueba de la tienda Rising Raimon.",
    },
    {
      id: demoIds.products[3],
      type: "BUNDLE" as const,
      name: "Pack Día de Partido · Demo",
      slug: "demo-pack-dia-partido",
      shortDescription: "Pack flexible con camiseta, pantalón y bufanda configurables por separado.",
      description: "Pack de demostración de tres componentes para probar tallas y personalizaciones independientes.",
      seoTitle: "Pack de demostración Rising Raimon",
      seoDescription: "Pack de prueba con tres productos configurables.",
    },
  ];
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: { ...product, status: "PUBLISHED", archivedAt: null },
      create: { ...product, status: "PUBLISHED" },
    });
  }

  const productSizes: Record<string, string[]> = {
    [demoIds.products[0]]: ["XS", "S", "M", "L", "XL"],
    [demoIds.products[1]]: ["S", "M", "L", "XL"],
    [demoIds.products[2]]: ["Única"],
  };
  for (const [productId, labels] of Object.entries(productSizes)) {
    for (const [sortOrder, label] of labels.entries()) {
      await prisma.productSize.upsert({
        where: { productId_sizeId: { productId, sizeId: sizes.get(label)! } },
        update: { sortOrder },
        create: { productId, sizeId: sizes.get(label)!, sortOrder },
      });
    }
  }

  const customizations = [
    { id: demoIds.customizations[0], productId: demoIds.products[0], type: "NAME" as const, label: "Nombre", maxLength: 12, minNumber: null, maxNumber: null, sortOrder: 0 },
    { id: demoIds.customizations[1], productId: demoIds.products[0], type: "NUMBER" as const, label: "Dorsal", maxLength: null, minNumber: 0, maxNumber: 99, sortOrder: 1 },
    { id: demoIds.customizations[2], productId: demoIds.products[2], type: "NAME" as const, label: "Texto", maxLength: 16, minNumber: null, maxNumber: null, sortOrder: 0 },
  ];
  for (const customization of customizations) {
    await prisma.productCustomization.upsert({
      where: { id: customization.id },
      update: { ...customization, isActive: true },
      create: { ...customization, isActive: true },
    });
  }

  const components = [
    { id: demoIds.components[0], bundleProductId: demoIds.products[3], componentProductId: demoIds.products[0], label: "Producto 1", quantity: 1, sortOrder: 0 },
    { id: demoIds.components[1], bundleProductId: demoIds.products[3], componentProductId: demoIds.products[1], label: "Producto 2", quantity: 1, sortOrder: 1 },
    { id: demoIds.components[2], bundleProductId: demoIds.products[3], componentProductId: demoIds.products[2], label: "Producto 3", quantity: 1, sortOrder: 2 },
  ];
  for (const component of components) {
    await prisma.bundleComponent.upsert({
      where: { id: component.id },
      update: component,
      create: component,
    });
  }

  const drops = [
    { id: demoIds.drops[0], title: "Drop Partido · Demo", slug: "demo-drop-partido", shortText: "Drop activo para probar catálogo, carrito y cupones.", startsAt: dates.activeStart, endsAt: dates.activeEnd, status: "PUBLISHED" as const, isPrimary: false },
    { id: demoIds.drops[1], title: "Próximo Drop · Demo", slug: "demo-drop-proximo", shortText: "Drop futuro para comprobar cuenta atrás y que los precios no se anticipan.", startsAt: dates.upcomingStart, endsAt: dates.upcomingEnd, status: "PUBLISHED" as const, isPrimary: false },
    { id: demoIds.drops[2], title: "Drop Histórico · Demo", slug: "demo-drop-historico", shortText: "Drop finalizado para comprobar el catálogo histórico no comprable.", startsAt: dates.endedStart, endsAt: dates.endedEnd, status: "PUBLISHED" as const, isPrimary: false },
  ];
  for (const drop of drops) {
    await prisma.drop.upsert({
      where: { id: drop.id },
      update: { ...drop, archivedAt: null },
      create: drop,
    });
  }

  const dropProducts = [
    { id: demoIds.dropProducts[0], dropId: demoIds.drops[0], productId: demoIds.products[0], priceCents: 3490, compareAtPriceCents: 3990, sortOrder: 0 },
    { id: demoIds.dropProducts[1], dropId: demoIds.drops[0], productId: demoIds.products[1], priceCents: 2490, compareAtPriceCents: null, sortOrder: 1 },
    { id: demoIds.dropProducts[2], dropId: demoIds.drops[0], productId: demoIds.products[2], priceCents: 1590, compareAtPriceCents: null, sortOrder: 2 },
    { id: demoIds.dropProducts[3], dropId: demoIds.drops[0], productId: demoIds.products[3], priceCents: 6990, compareAtPriceCents: 7990, sortOrder: 3 },
    { id: demoIds.dropProducts[4], dropId: demoIds.drops[1], productId: demoIds.products[3], priceCents: 7490, compareAtPriceCents: 8490, sortOrder: 0 },
    { id: demoIds.dropProducts[5], dropId: demoIds.drops[1], productId: demoIds.products[2], priceCents: 1790, compareAtPriceCents: null, sortOrder: 1 },
    { id: demoIds.dropProducts[6], dropId: demoIds.drops[2], productId: demoIds.products[0], priceCents: 3290, compareAtPriceCents: 3790, sortOrder: 0 },
    { id: demoIds.dropProducts[7], dropId: demoIds.drops[2], productId: demoIds.products[3], priceCents: 6490, compareAtPriceCents: 7490, sortOrder: 1 },
  ];
  for (const dropProduct of dropProducts) {
    await prisma.dropProduct.upsert({
      where: { id: dropProduct.id },
      update: { ...dropProduct, isVisible: true },
      create: { ...dropProduct, isVisible: true },
    });
  }

  const dropCustomizations = [
    { id: demoIds.dropCustomizations[0], dropProductId: demoIds.dropProducts[0], productCustomizationId: demoIds.customizations[0], bundleComponentId: null, surchargeCents: 500 },
    { id: demoIds.dropCustomizations[1], dropProductId: demoIds.dropProducts[0], productCustomizationId: demoIds.customizations[1], bundleComponentId: null, surchargeCents: 300 },
    { id: demoIds.dropCustomizations[2], dropProductId: demoIds.dropProducts[2], productCustomizationId: demoIds.customizations[2], bundleComponentId: null, surchargeCents: 400 },
    { id: demoIds.dropCustomizations[3], dropProductId: demoIds.dropProducts[3], productCustomizationId: demoIds.customizations[0], bundleComponentId: demoIds.components[0], surchargeCents: 500 },
    { id: demoIds.dropCustomizations[4], dropProductId: demoIds.dropProducts[3], productCustomizationId: demoIds.customizations[1], bundleComponentId: demoIds.components[0], surchargeCents: 300 },
    { id: demoIds.dropCustomizations[5], dropProductId: demoIds.dropProducts[3], productCustomizationId: demoIds.customizations[2], bundleComponentId: demoIds.components[2], surchargeCents: 400 },
  ];
  for (const configuration of dropCustomizations) {
    await prisma.dropProductCustomization.upsert({
      where: { id: configuration.id },
      update: { ...configuration, isEnabled: true },
      create: { ...configuration, isEnabled: true },
    });
  }

  const coupons = [
    { id: demoIds.coupons[0], code: "DEMO10", type: "PERCENT" as const, value: 10, dropId: null, minOrderCents: null, maxRedemptions: null, startsAt: null, endsAt: null, isActive: true },
    { id: demoIds.coupons[1], code: "DEMO5", type: "FIXED" as const, value: 500, dropId: null, minOrderCents: 3000, maxRedemptions: null, startsAt: null, endsAt: null, isActive: true },
    { id: demoIds.coupons[2], code: "DEMOPACK", type: "PERCENT" as const, value: 15, dropId: demoIds.drops[0], minOrderCents: 6000, maxRedemptions: 5, startsAt: dates.activeStart, endsAt: dates.activeEnd, isActive: true },
    { id: demoIds.coupons[3], code: "DEMOINACTIVO", type: "PERCENT" as const, value: 25, dropId: null, minOrderCents: null, maxRedemptions: null, startsAt: null, endsAt: null, isActive: false },
    { id: demoIds.coupons[4], code: "DEMOCADUCADO", type: "FIXED" as const, value: 1000, dropId: null, minOrderCents: null, maxRedemptions: null, startsAt: dates.endedStart, endsAt: dates.endedEnd, isActive: true },
    { id: demoIds.coupons[5], code: "DEMOFUTURO", type: "PERCENT" as const, value: 20, dropId: null, minOrderCents: null, maxRedemptions: null, startsAt: dates.upcomingStart, endsAt: dates.upcomingEnd, isActive: true },
  ];
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { id: coupon.id },
      update: { ...coupon, archivedAt: null },
      create: coupon,
    });
  }

  console.log("Datos demo preparados: 3 drops, 4 productos y 6 cupones.");
  console.log("Drop activo disponible durante 21 días desde este momento.");
}

seedDemo()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "No se han podido crear los datos demo.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
