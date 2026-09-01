import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (env.STORE_ENV !== "production") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/carrito", "/checkout", "/pedido/"],
      },
    ],
    host: env.SITE_URL,
    sitemap: new URL("/sitemap.xml", env.SITE_URL).toString(),
  };
}
