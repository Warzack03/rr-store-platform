import type { Metadata, Viewport } from "next";

import { env } from "@/lib/env";

import "./globals.css";

const shouldIndex = env.STORE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: "Tienda oficial | Rising Raimon",
    template: "%s | Rising Raimon",
  },
  description:
    "La tienda oficial de Rising Raimon. Equipaciones y prendas del club.",
  applicationName: "Tienda Rising Raimon",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Tienda Rising Raimon",
    title: "Tienda oficial | Rising Raimon",
    description: "Equipaciones y prendas oficiales de Rising Raimon.",
    images: [{ url: "/brand/escudo-rising-raimon.webp", alt: "Escudo de Rising Raimon" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tienda oficial | Rising Raimon",
    description: "Equipaciones y prendas oficiales de Rising Raimon.",
    images: ["/brand/escudo-rising-raimon.webp"],
  },
  verification: env.GOOGLE_SITE_VERIFICATION
    ? { google: env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: {
    icon: [{ url: "/brand/escudo-rising-raimon.webp", type: "image/webp" }],
    apple: "/brand/escudo-rising-raimon.webp",
  },
  robots: {
    index: shouldIndex,
    follow: shouldIndex,
    noarchive: !shouldIndex,
  },
};

export const viewport: Viewport = {
  themeColor: "#09172d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <a href="#contenido-principal" className="skip-link">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
