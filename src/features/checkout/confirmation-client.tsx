"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useCart } from "@/features/cart/cart-provider";
import { emptyCart } from "@/features/cart/domain";

export function ConfirmationPending() {
  const router = useRouter();
  useEffect(() => { const timer = window.setInterval(() => router.refresh(), 2_000); return () => window.clearInterval(timer); }, [router]);
  return <div className="brand-panel p-8 text-center sm:p-12"><p className="font-heading text-sm font-bold uppercase tracking-widest text-brand-gold">Pago recibido</p><h1 className="mt-3 font-display text-6xl text-white">Estamos confirmando tu pago…</h1><p className="mt-5 text-white/68">No cierres esta página. Si tarda, recibirás la confirmación cuando el pedido esté listo.</p></div>;
}

export function ClearCartAfterOrder() {
  const { replaceCart, hydrated } = useCart();
  const cleared = useRef(false);
  useEffect(() => { if (hydrated && !cleared.current) { cleared.current = true; replaceCart(emptyCart()); } }, [hydrated, replaceCart]);
  return null;
}
