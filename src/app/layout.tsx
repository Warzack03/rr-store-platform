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
