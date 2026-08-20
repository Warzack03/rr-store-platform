import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Productos",
  description: "Próximas prendas y equipaciones oficiales de Rising Raimon.",
};

export default function ProductsPage() {
  return (
    <section className="mx-auto flex min-h-[62vh] max-w-[80rem] items-center px-5 py-16 md:px-8 xl:px-12">
      <div className="brand-panel w-full px-6 py-14 sm:px-10 md:py-20">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">
          Próxima colección
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-6xl leading-[0.9] tracking-wide text-white sm:text-7xl md:text-8xl">
          Nuevos colores. La misma pasión.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
          La próxima colección está en camino. Muy pronto encontrarás aquí las
          prendas oficiales del club.
        </p>
        <div className="mt-8">
          <ButtonLink href="/">Volver al inicio</ButtonLink>
        </div>
      </div>
    </section>
  );
}
