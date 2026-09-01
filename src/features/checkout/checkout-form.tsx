"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/features/cart/cart-provider";
import type { ValidatedCart } from "@/features/cart/validation-types";
import { formatMoney } from "@/features/catalog/domain";

export function CheckoutForm({ shippingCents }: { shippingCents: number }) {
  const { cart, hydrated } = useCart();
  const [validated, setValidated] = useState<ValidatedCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    void fetch("/api/cart/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cart), signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("cart-validation-failed");
        return response.json() as Promise<ValidatedCart>;
      })
      .then((nextValidated) => {
        if (controller.signal.aborted) return;
        setValidated(nextValidated);
        setError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setValidated(null);
        setError("No hemos podido validar el carrito.");
      });
    return () => controller.abort();
  }, [cart, hydrated]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError(null);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, cart, legalAccepted: form.get("legalAccepted") === "on" }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "No hemos podido preparar el pago.");
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No hemos podido preparar el pago.");
      setSubmitting(false);
    }
  }

  if (!hydrated || !validated) return <div className="h-72 animate-pulse border border-white/10 bg-white/[0.025]" />;
  if (validated.lines.length === 0) return <div className="brand-panel p-8 text-center"><h1 className="font-display text-6xl text-white">Tu carrito está vacío</h1><div className="mt-6"><Link className="text-brand-gold underline" href="/productos">Ver productos</Link></div></div>;
  const field = "mt-2 min-h-12 w-full border border-white/20 bg-[#07101d] px-4 text-white placeholder:text-white/35";
  const total = validated.totalCents + shippingCents;

  return <form className="grid gap-8 lg:grid-cols-[1fr_23rem]" onSubmit={submit}>
    <div className="space-y-7">
      <section className="border border-white/12 bg-white/[0.025] p-5 sm:p-7"><h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">1. Contacto</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-white">Nombre<input autoComplete="given-name" className={field} name="firstName" required /></label><label className="text-sm font-semibold text-white">Apellidos<input autoComplete="family-name" className={field} name="lastName" required /></label><label className="text-sm font-semibold text-white">Email<input autoComplete="email" className={field} name="email" required type="email" /></label><label className="text-sm font-semibold text-white">Teléfono<input autoComplete="tel" className={field} name="phone" required type="tel" /></label></div></section>
      <section className="border border-white/12 bg-white/[0.025] p-5 sm:p-7"><h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">2. Entrega a domicilio</h2><p className="mt-2 text-sm text-white/55">Actualmente realizamos envíos únicamente a España peninsular.</p><input name="shippingKind" type="hidden" value="HOME" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-white">Código postal<input autoComplete="postal-code" className={field} inputMode="numeric" maxLength={5} name="postalCode" pattern="\d{5}" required /></label><label className="text-sm font-semibold text-white">Provincia<input autoComplete="address-level1" className={field} name="province" required /></label><label className="text-sm font-semibold text-white">Localidad<input autoComplete="address-level2" className={field} name="city" required /></label><label className="text-sm font-semibold text-white">Dirección<input autoComplete="street-address" className={field} name="street" required /></label><label className="text-sm font-semibold text-white">Número<input className={field} name="streetNumber" required /></label><label className="text-sm font-semibold text-white">Piso / puerta (opcional)<input className={field} name="additionalLine" /></label></div></section>
      <section className="border border-white/12 bg-white/[0.025] p-5 sm:p-7"><h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">3. Observaciones</h2><textarea className={field} maxLength={2000} name="notes" placeholder="Indicaciones opcionales sobre el pedido" rows={4} /></section>
      <label className="flex items-start gap-3 border border-white/12 p-5 text-sm leading-6 text-white/75"><input className="mt-1 size-5 shrink-0 accent-[#ffd46f]" name="legalAccepted" required type="checkbox" /><span>He leído y acepto las <Link className="font-semibold text-brand-gold underline underline-offset-4" href="/condiciones-de-compra" target="_blank">condiciones de compra</Link> y la <Link className="font-semibold text-brand-gold underline underline-offset-4" href="/privacidad" target="_blank">política de privacidad</Link>.</span></label>
      {error ? <p className="border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</p> : null}
    </div>
    <aside className="h-fit border border-white/12 bg-[#0b1b31] p-6 lg:sticky lg:top-28"><h2 className="font-heading text-2xl font-bold uppercase text-white">Resumen</h2><ul className="mt-5 divide-y divide-white/10">{validated.lines.map((line) => <li className="flex justify-between gap-4 py-3 text-sm" key={line.id}><span className="text-white/70">{line.quantity} × {line.name}</span><strong className="text-white">{formatMoney(line.lineTotalCents)}</strong></li>)}</ul><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between text-white/65"><dt>Subtotal</dt><dd>{formatMoney(validated.subtotalCents)}</dd></div>{validated.discountCents > 0 ? <div className="flex justify-between text-emerald-200"><dt>Descuento</dt><dd>−{formatMoney(validated.discountCents)}</dd></div> : null}<div className="flex justify-between text-white/65"><dt>Envío a domicilio</dt><dd>{formatMoney(shippingCents)}</dd></div><div className="flex justify-between border-t border-white/12 pt-4 text-xl font-bold text-white"><dt>Total</dt><dd>{formatMoney(total)}</dd></div></dl><button className="mt-6 min-h-14 w-full border border-brand-gold bg-brand-gold px-5 font-heading text-lg font-bold uppercase tracking-wide text-brand-panel hover:bg-[#ffe19a] disabled:cursor-wait disabled:opacity-60" disabled={submitting} type="submit">{submitting ? "Preparando el pago…" : `Pagar · ${formatMoney(total)}`}</button><p className="mt-3 text-center text-xs text-white/45">Pago seguro alojado por Stripe.</p></aside>
  </form>;
}
