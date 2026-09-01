import type { Metadata } from "next";

import { BrandMark } from "@/components/brand/brand-mark";
import { ButtonLink } from "@/components/ui/button-link";
import { CatalogImage } from "@/features/catalog/components/catalog-image";
import { Countdown } from "@/features/catalog/components/countdown";
import { DropSection } from "@/features/catalog/components/drop-section";
import { dropStateLabels } from "@/features/catalog/domain";
import { getPublicCatalog } from "@/features/catalog/server/catalog";
import { getPublicStoreSettings } from "@/features/settings/server/store-settings";
import { env } from "@/lib/env";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "Tienda Rising Raimon",
    title: "Tienda oficial | Rising Raimon",
    description: "Equipaciones y prendas oficiales de Rising Raimon.",
    images: [
      {
        url: "/brand/escudo-rising-raimon.webp",
        alt: "Escudo de Rising Raimon",
      },
    ],
  },
};

export default async function HomePage() {
  const [catalog, settings] = await Promise.all([
    getPublicCatalog(),
    getPublicStoreSettings(),
  ]);
  const featuredDrop = catalog.find((drop) => drop.state !== "ENDED") ?? null;
  const now = new Date().toISOString();
  const storeName = settings?.storeName ?? "Tienda Rising Raimon";
  const supportEmail = settings?.supportEmail ?? "risingraimon@gmail.com";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: storeName,
    url: env.SITE_URL,
    logo: new URL("/brand/escudo-rising-raimon.webp", env.SITE_URL).toString(),
    email: supportEmail,
    areaServed: { "@type": "Country", name: "España" },
    sameAs: ["https://risingraimon.es"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
      />
      <section className="mx-auto max-w-[80rem] px-5 py-8 md:px-8 md:py-12 xl:px-12 xl:py-16">
        {featuredDrop ? (
          <div className="brand-panel grid min-h-[34rem] overflow-hidden md:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
              <p className="font-heading text-sm font-bold uppercase tracking-[0.24em] text-brand-gold sm:text-base">
                {dropStateLabels[featuredDrop.state]}
              </p>
              <h1 className="mt-4 font-display text-[clamp(4rem,10vw,8rem)] leading-[0.84] tracking-[0.015em] text-white">
                {featuredDrop.title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                {featuredDrop.shortText}
              </p>

              <div className="mt-7">
                <Countdown
                  state={featuredDrop.state === "UPCOMING" ? "UPCOMING" : "AVAILABLE"}
                  target={
                    featuredDrop.state === "UPCOMING"
                      ? featuredDrop.startsAt
                      : featuredDrop.endsAt
                  }
                  initialNow={now}
                />
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href="/productos"
                >
                  Ver productos
                </ButtonLink>
                <ButtonLink
                  href="https://risingraimon.es"
                  external
                  variant="secondary"
                >
                  Volver al club
                </ButtonLink>
              </div>
            </div>

            <div className="relative min-h-80 overflow-hidden border-t border-white/10 bg-[#0e223b] md:min-h-full md:border-l md:border-t-0">
              <CatalogImage
                image={featuredDrop.hero}
                priority
                sizes="(max-width: 767px) 100vw, 48vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07162999] via-transparent to-transparent" />
            </div>
          </div>
        ) : (
          <div className="brand-panel grid min-h-[33rem] items-center gap-10 px-6 py-12 md:grid-cols-[1.25fr_0.75fr] md:px-12 lg:px-16">
            <div className="relative z-10 max-w-2xl">
              <p className="font-heading text-sm font-bold uppercase tracking-[0.24em] text-brand-gold sm:text-base">
                Tienda oficial
              </p>
              <h1 className="mt-4 font-display text-[clamp(3.75rem,12vw,8.5rem)] leading-[0.83] tracking-[0.015em] text-white">
                Estamos preparando el próximo drop
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                Estamos ultimando el próximo lanzamiento. Mientras tanto, puedes
                consultar todas las prendas del club.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/productos">Ver catálogo</ButtonLink>
                <ButtonLink
                  href="https://risingraimon.es"
                  external
                  variant="secondary"
                >
                  Volver al club
                </ButtonLink>
              </div>
            </div>

            <div className="relative z-10 mx-auto flex aspect-square w-full max-w-[18rem] items-center justify-center rounded-full border border-brand-gold/30 bg-brand-gold/[0.06] md:max-w-[22rem]">
              <div className="absolute inset-5 rounded-full border border-white/10" />
              <BrandMark priority size={230} />
            </div>
          </div>
        )}
      </section>

      {featuredDrop ? (
        <div className="mx-auto max-w-[80rem] px-5 pb-16 md:px-8 md:pb-24 xl:px-12">
          <DropSection drop={featuredDrop} />
        </div>
      ) : null}
    </>
  );
}
