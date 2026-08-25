import type { Metadata } from "next";

import { CheckoutForm } from "@/features/checkout/checkout-form";
import { getPrismaClient } from "@/server/db/client";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const shipping = await getPrismaClient().shippingMethod.findUnique({ where: { kind: "HOME" }, select: { priceCents: true, isEnabled: true } });
  return <main className="mx-auto max-w-[80rem] px-5 py-10 md:px-8 md:py-14 xl:px-12"><p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">Finalizar pedido</p><h1 className="mt-2 mb-9 font-display text-6xl tracking-wide text-white sm:text-7xl">Checkout</h1>{shipping?.isEnabled ? <CheckoutForm shippingCents={shipping.priceCents} /> : <p className="border border-white/12 p-6 text-white/70">El envío a domicilio no está disponible en este momento.</p>}</main>;
}
