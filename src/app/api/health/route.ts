import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/server/db/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabaseHealth();
  const isHealthy = database !== "unavailable";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      checks: {
        application: "ok",
        database,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
