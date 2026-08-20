import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl } from "@/lib/env";

const globalDatabase = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("La base de datos no está configurada.");
  }

  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "");

  if (!url.hostname || !url.username || !database) {
    throw new Error("La configuración de la base de datos no es válida.");
  }

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(database),
    connectionLimit: 5,
    connectTimeout: 5_000,
    idleTimeout: 300,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrismaClient(): PrismaClient {
  if (!globalDatabase.prisma) {
    globalDatabase.prisma = createPrismaClient();
  }

  return globalDatabase.prisma;
}
