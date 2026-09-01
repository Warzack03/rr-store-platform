import "server-only";

import { unstable_cache } from "next/cache";

import { getPrismaClient } from "@/server/db/client";

export const getPublicStoreSettings = unstable_cache(
  async () => getPrismaClient().storeSettings.findUnique({
    where: { id: 1 },
    select: { storeName: true, supportEmail: true, deliveryEstimateText: true, globalNotice: true, globalNoticeEnabled: true },
  }),
  ["public-store-settings"],
  { revalidate: 60, tags: ["store-settings"] },
);
