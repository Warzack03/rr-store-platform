import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { DropSection } from "@/features/catalog/components/drop-section";
import { getPublicCatalog } from "@/features/catalog/server/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Equipaciones, camisetas y prendas oficiales de Rising Raimon, agrupadas por drops.",
  alternates: { canonical: "/productos" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/productos",
    siteName: "Tienda Rising Raimon",
    title: "Productos | Rising Raimon",
    description:
      "Equipaciones, camisetas y prendas oficiales de Rising Raimon.",
  },
};

export default async function ProductsPage() {
  const catalog = await getPublicCatalog();

  return (
    <div className="mx-auto max-w-[80rem] px-5 py-12 md:px-8 md:py-16 xl:px-12 xl:py-20">
      <header className="mb-12 max-w-4xl border-b border-white/12 pb-8">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">
          Tienda oficial
        </p>
        <h1 className="mt-3 font-display text-6xl leading-[0.9] tracking-wide text-white sm:text-7xl md:text-8xl">
          Productos Rising Raimon
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
          Descubre las colecciones actuales y las equipaciones que ya han formado
          parte de nuestra historia.
        </p>
      </header>

      {catalog.length > 0 ? (
        <div className="space-y-20">
          {catalog.map((drop) => (
            <DropSection key={drop.id} drop={drop} />
          ))}
        </div>
      ) : (
        <section className="brand-panel px-6 py-14 sm:px-10 md:py-20">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">
            Próxima colección
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-6xl leading-[0.9] tracking-wide text-white sm:text-7xl">
            Estamos preparando el próximo drop
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Todavía no hay prendas publicadas. Vuelve pronto para descubrir los
            próximos colores del club.
          </p>
          <div className="mt-8">
            <ButtonLink href="/">Volver al inicio</ButtonLink>
          </div>
        </section>
      )}
    </div>
  );
}
