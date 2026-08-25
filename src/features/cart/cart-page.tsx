"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ButtonLink } from "@/components/ui/button-link";
import { formatMoney } from "@/features/catalog/domain";

import { useCart } from "./cart-provider";
import { normalizeCouponCode } from "./domain";
import type { ValidatedCart } from "./validation-types";

export function CartPageContent() {
  const {
    cart,
    hydrated,
    changeQuantity,
    removeLine,
    replaceCart,
    setCouponCode,
  } = useCart();
  const serializedCart = useMemo(() => JSON.stringify(cart), [cart]);
  const skipValidationFor = useRef<string | null>(null);
  const [validated, setValidated] = useState<ValidatedCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [validationTick, setValidationTick] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    if (skipValidationFor.current === serializedCart) {
      skipValidationFor.current = null;
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setRequestError(null);
    void fetch("/api/cart/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: serializedCart,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo validar el carrito.");
        return response.json() as Promise<ValidatedCart>;
      })
      .then((result) => {
        setValidated(result);
        const sanitized = JSON.stringify(result.cart);
        if (sanitized !== serializedCart) {
          skipValidationFor.current = sanitized;
          replaceCart(result.cart);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRequestError(
          "No hemos podido comprobar precios y disponibilidad. Inténtalo de nuevo.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [hydrated, replaceCart, serializedCart, validationTick]);

  useEffect(() => {
    if (!validated?.dropEndsAt) return;
    const remaining = new Date(validated.dropEndsAt).valueOf() - Date.now();
    if (remaining <= 0) return;
    const timer = window.setTimeout(
      () => setValidationTick((value) => value + 1),
      Math.min(remaining + 50, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [validated?.dropEndsAt]);

  if (!hydrated || (loading && !validated)) {
    return (
      <section className="mx-auto min-h-[62vh] max-w-[80rem] px-5 py-12 md:px-8 xl:px-12">
        <div className="h-56 animate-pulse border border-white/10 bg-white/[0.025]" />
      </section>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <section className="mx-auto flex min-h-[62vh] max-w-[80rem] items-center justify-center px-5 py-16 md:px-8 xl:px-12">
        <div className="max-w-xl text-center">
          {validated?.issues.length ? (
            <div className="mb-7 border border-brand-gold/35 bg-brand-gold/10 px-4 py-3 text-sm text-white">
              {validated.issues.map((issue) => <p key={issue}>{issue}</p>)}
            </div>
          ) : null}
          <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">
            Tu selección
          </p>
          <h1 className="mt-3 font-display text-6xl tracking-wide text-white sm:text-7xl">
            Tu carrito está vacío
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-7 text-white/68">
            Explora el drop activo y configura tus prendas antes de completar el pedido.
          </p>
          <div className="mt-8"><ButtonLink href="/productos">Ver productos</ButtonLink></div>
        </div>
      </section>
    );
  }

  return (
    <main className="mx-auto max-w-[80rem] px-5 py-10 md:px-8 md:py-14 xl:px-12">
      <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">
        {validated?.dropTitle ?? "Tu selección"}
      </p>
      <h1 className="mt-2 font-display text-6xl tracking-wide text-white sm:text-7xl">Carrito</h1>

      {validated?.issues.length ? (
        <div className="mt-7 border border-brand-gold/35 bg-brand-gold/10 px-4 py-3 text-sm text-white" role="status">
          {validated.issues.map((issue) => <p key={issue}>{issue}</p>)}
        </div>
      ) : null}
      {requestError ? <p className="mt-7 border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">{requestError}</p> : null}

      <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_23rem]">
        <section aria-label="Productos del carrito" className="divide-y divide-white/12 border-y border-white/12">
          {validated?.lines.map((line) => (
            <article className="grid gap-5 py-6 sm:grid-cols-[8rem_1fr_auto]" key={line.id}>
              <div className="relative aspect-square overflow-hidden bg-white/[0.04]">
                {line.image ? <Image alt={line.image.altText} className="object-cover" fill sizes="128px" src={line.image.url} /> : null}
              </div>
              <div>
                <Link className="font-heading text-2xl font-bold uppercase tracking-wide text-white hover:text-brand-gold" href={`/productos/${line.slug}`}>
                  {line.name}
                </Link>
                <ul className="mt-2 space-y-1 text-sm text-white/62">
                  {line.selections.map((selection) => <li key={selection}>{selection}</li>)}
                </ul>
                {line.unitCustomizationCents > 0 ? <p className="mt-2 text-xs text-brand-gold">Personalización: +{formatMoney(line.unitCustomizationCents)} / ud.</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="inline-flex border border-white/20">
                    <button aria-label={`Reducir ${line.name}`} className="size-10 text-xl text-white hover:bg-white/12" onClick={() => changeQuantity(line.id, line.quantity - 1)} type="button">−</button>
                    <span className="inline-flex min-w-10 items-center justify-center font-bold text-white">{line.quantity}</span>
                    <button aria-label={`Aumentar ${line.name}`} className="size-10 text-xl text-white hover:bg-white/12" onClick={() => changeQuantity(line.id, line.quantity + 1)} type="button">+</button>
                  </div>
                  <Link className="text-sm font-semibold text-brand-gold underline underline-offset-4 hover:text-white" href={`/productos/${line.slug}?editar=${line.id}`}>Editar</Link>
                  <button className="text-sm text-white/55 underline underline-offset-4 hover:text-red-200" onClick={() => removeLine(line.id)} type="button">Eliminar</button>
                </div>
              </div>
              <p className="text-right text-xl font-bold text-white">{formatMoney(line.lineTotalCents)}</p>
            </article>
          ))}
          {loading ? <p className="py-3 text-sm text-white/45">Actualizando precios…</p> : null}
        </section>

        <aside className="h-fit border border-white/12 bg-white/[0.025] p-5 sm:p-6">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-white">Resumen</h2>
          <details className="mt-5 border-y border-white/12 py-4">
            <summary className="cursor-pointer font-heading font-bold uppercase tracking-wide text-brand-gold">¿Tienes un cupón?</summary>
            <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); setCouponCode(couponInput); }}>
              <input aria-label="Código de cupón" className="min-w-0 flex-1 border border-white/20 bg-[#07101d] px-3 text-sm uppercase text-white placeholder:text-white/35" onChange={(event) => setCouponInput(normalizeCouponCode(event.target.value))} placeholder="CÓDIGO" value={couponInput} />
              <button className="border border-brand-gold px-4 py-3 font-heading font-bold uppercase text-brand-gold hover:bg-brand-gold hover:text-brand-panel" type="submit">Aplicar</button>
            </form>
          </details>
          {validated?.coupon ? <div className="mt-4 flex items-start justify-between gap-4 border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100"><span><strong>{validated.coupon.code}</strong><br />{validated.coupon.description}</span><button className="underline" onClick={() => { setCouponCode(null); setCouponInput(""); }} type="button">Quitar</button></div> : null}
          {validated?.couponError ? <p className="mt-4 text-sm text-red-200" role="alert">{validated.couponError}</p> : null}
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-white/65"><dt>Subtotal</dt><dd>{formatMoney(validated?.subtotalCents ?? 0)}</dd></div>
            {(validated?.discountCents ?? 0) > 0 ? <div className="flex justify-between gap-4 text-emerald-200"><dt>Descuento</dt><dd>−{formatMoney(validated?.discountCents ?? 0)}</dd></div> : null}
            <div className="flex justify-between gap-4 text-white/50"><dt>Envío</dt><dd>Se calcula después</dd></div>
            <div className="flex justify-between gap-4 border-t border-white/12 pt-4 text-xl font-bold text-white"><dt>Total</dt><dd>{formatMoney(validated?.totalCents ?? 0)}</dd></div>
          </dl>
          {!loading && !requestError && validated?.lines.length ? <Link className="mt-6 inline-flex min-h-14 w-full items-center justify-center border border-brand-gold bg-brand-gold px-5 font-heading text-lg font-bold uppercase tracking-wide text-brand-panel hover:bg-[#ffe19a]" href="/checkout">Continuar con el pedido</Link> : <button className="mt-6 min-h-14 w-full cursor-not-allowed border border-white/15 bg-white/8 px-5 font-heading text-lg font-bold uppercase tracking-wide text-white/45" disabled type="button">Continuar con el pedido</button>}
          <p className="mt-3 text-center text-xs leading-5 text-white/45">El envío se confirma antes de acceder al pago seguro.</p>
        </aside>
      </div>
    </main>
  );
}
