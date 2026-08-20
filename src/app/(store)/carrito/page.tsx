import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <section className="mx-auto flex min-h-[62vh] max-w-[80rem] items-center justify-center px-5 py-16 md:px-8 xl:px-12">
      <div className="max-w-xl text-center">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">
          Tu selección
        </p>
        <h1 className="mt-3 font-display text-6xl tracking-wide text-white sm:text-7xl">
          Tu carrito está vacío
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-white/68">
          Cuando el próximo drop esté disponible, podrás guardar aquí tus
          prendas antes de completar el pedido.
        </p>
        <div className="mt-8">
          <ButtonLink href="/productos">Ver productos</ButtonLink>
        </div>
      </div>
    </section>
  );
}
