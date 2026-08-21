import type { MetadataRoute } from "next";

import { getPublicProductSlugs } from "@/features/catalog/server/catalog";
import { env } from "@/lib/env";

export const revalidate = 3_600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (env.STORE_ENV !== "production") return [];

  const products = await getPublicProductSlugs();

  return [
    {
      url: new URL("/", env.SITE_URL).toString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: new URL("/productos", env.SITE_URL).toString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...products.map(({ slug, updatedAt }) => ({
      url: new URL(`/productos/${slug}`, env.SITE_URL).toString(),
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
