import "dotenv/config";

import { getPrismaClient } from "../src/server/db/client";

const prisma = getPrismaClient();

async function seed() {
  await prisma.$transaction([
    prisma.storeSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        storeName: "Tienda Rising Raimon",
        supportEmail: "risingraimon@gmail.com",
        deliveryEstimateText: "Entrega estimada en 24-48 horas tras el envío.",
      },
    }),
    prisma.shippingMethod.upsert({
      where: { kind: "HOME" },
      update: {},
      create: {
        kind: "HOME",
        displayName: "Envío a domicilio",
        priceCents: 499,
        sortOrder: 10,
      },
    }),
    prisma.shippingMethod.upsert({
      where: { kind: "PICKUP" },
      update: { isEnabled: false },
      create: {
        kind: "PICKUP",
        displayName: "Punto SEUR Pickup",
        priceCents: 349,
        isEnabled: false,
        sortOrder: 20,
      },
    }),
  ]);

  console.log("Configuración inicial de la tienda preparada.");
}

seed()
  .catch(() => {
    console.error("No se ha podido preparar la configuración inicial.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
