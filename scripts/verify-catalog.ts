import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { getPrismaClient } from "../src/server/db/client";

const prisma = getPrismaClient();
const baseUrl = new URL(
  process.argv[2] ?? process.env.CATALOG_BASE_URL ?? "http://127.0.0.1:3000",
);

async function verifyResponse(pathname: string, expectedStatus: number) {
  const response = await fetch(new URL(pathname, baseUrl), { redirect: "manual" });
  assert.equal(response.status, expectedStatus, `${pathname} no respondió ${expectedStatus}`);
  return response;
}

async function verifyCatalog() {
  await verifyResponse("/", 200);
  await verifyResponse("/productos", 200);
  await verifyResponse("/productos/no-existe", 404);
  await verifyResponse("/media/no-existe.webp", 404);

  const fromPath = `/verificacion-fase-3-${randomUUID()}`;
  try {
    await prisma.redirect.create({
      data: { fromPath, toPath: "/productos" },
    });
    const redirectResponse = await verifyResponse(fromPath, 301);
    assert.equal(
      new URL(redirectResponse.headers.get("location") ?? "", baseUrl).pathname,
      "/productos",
    );
  } finally {
    await prisma.redirect.deleteMany({ where: { fromPath } });
  }

  console.log("Rutas públicas, 404, medios y redirect 301 verificados.");
}

verifyCatalog()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Verificación fallida.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
