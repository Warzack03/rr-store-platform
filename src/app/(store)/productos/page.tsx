import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";
import { ProductCard } from "@/features/catalog/components/product-card";
import { getPublicProducts } from "@/features/catalog/server/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Productos",
  description: "Todos los productos oficiales de Rising Raimon y su disponibilidad actual.",
  alternates: { canonical: "/productos" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/productos",
    siteName: "Tienda Rising Raimon",
    title: "Productos | Rising Raimon",
    description: "Equipaciones, camisetas y prendas oficiales de Rising Raimon.",
  },
};

export default async function ProductsPage() {
  const products = await getPublicProducts();

  return (
    <div className="mx-auto max-w-[80rem] px-5 py-12 md:px-8 md:py-16 xl:px-12 xl:py-20">
      <header className="mb-12 max-w-4xl border-b border-white/12 pb-8">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">Tienda oficial</p>
        <h1 className="mt-3 font-display text-6xl leading-[0.9] tracking-wide text-white sm:text-7xl md:text-8xl">Productos Rising Raimon</h1>
      </header>

      {products.length > 0 ? <section aria-labelledby="catalogo-completo"><h2 className="sr-only" id="catalogo-completo">Catálogo completo</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 3} />)}</div></section> : <section className="brand-panel px-6 py-14 sm:px-10 md:py-20"><p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">Catálogo</p><h2 className="mt-3 max-w-3xl font-display text-6xl leading-[0.9] tracking-wide text-white sm:text-7xl">Todavía no hay productos publicados</h2><p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">Vuelve pronto para descubrir las próximas prendas del club.</p><div className="mt-8"><ButtonLink href="/">Volver al inicio</ButtonLink></div></section>}
    </div>
  );
}
