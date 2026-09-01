import type { MetadataRoute } from "next";

import { getPublicProductSlugs } from "@/features/catalog/server/catalog";
import { env } from "@/lib/env";

export const revalidate = 3_600;

const staticPages = [
  ["/", "daily", 1],
  ["/productos", "daily", 0.9],
  ["/aviso-legal", "monthly", 0.3],
  ["/privacidad", "monthly", 0.3],
  ["/cookies", "monthly", 0.3],
  ["/condiciones-de-compra", "monthly", 0.4],
  ["/envios", "monthly", 0.4],
  ["/cambios-y-devoluciones", "monthly", 0.4],
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (env.STORE_ENV !== "production") return [];

  const products = await getPublicProductSlugs();

  return [
    ...staticPages.map(([path, changeFrequency, priority]) => ({
      url: new URL(path, env.SITE_URL).toString(),
      changeFrequency,
      priority,
    })),
    ...products.map(({ slug, updatedAt }) => ({
      url: new URL(`/productos/${slug}`, env.SITE_URL).toString(),
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
