import { getDatabaseUrl } from "@/lib/env";
import { getPrismaClient } from "@/server/db/client";

export type DatabaseHealth = "ok" | "not_configured" | "unavailable";

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!getDatabaseUrl()) {
    return "not_configured";
  }

  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    return "ok";
  } catch {
    return "unavailable";
  }
}
