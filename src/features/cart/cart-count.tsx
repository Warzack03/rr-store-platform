"use client";

import { useCart } from "./cart-provider";

export function CartCount() {
  const { hydrated, itemCount } = useCart();
  if (!hydrated || itemCount === 0) return null;
  return <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-gold px-1.5 py-0.5 text-xs font-bold text-brand-panel" aria-label={`${itemCount} artículos`}>{itemCount}</span>;
}
