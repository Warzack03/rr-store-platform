import Link from "next/link";

import { dropStateLabels, formatDropDate, formatMoney } from "../domain";
import type { CatalogProductCard } from "../types";
import { CatalogImage } from "./catalog-image";

export function ProductCard({ product, priority = false }: { product: CatalogProductCard; priority?: boolean }) {
  const statusLabel = product.dropState === "UNAVAILABLE" ? "No disponible" : dropStateLabels[product.dropState];
  const statusTone = product.dropState === "AVAILABLE"
    ? "border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
    : product.dropState === "UPCOMING"
      ? "border-brand-gold/40 bg-brand-gold/15 text-brand-gold"
      : "border-white/15 bg-[#071629e8] text-white/75";

  return (
    <article className="group min-w-0 border border-white/12 bg-[#0b1b31]">
      <Link href={`/productos/${product.slug}`} className="block focus-visible:outline-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#0e223b]">
          <CatalogImage image={product.image} priority={priority} sizes="(max-width: 767px) 92vw, (max-width: 1279px) 44vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none" />
          <span className={`absolute left-3 top-3 border px-3 py-1.5 font-heading text-xs font-bold uppercase tracking-[0.12em] ${statusTone}`}>{statusLabel}</span>
        </div>

        <div className="p-5 sm:p-6">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">{product.dropTitle ?? "Catálogo Rising Raimon"}</p>
          <h3 className="mt-2 font-heading text-2xl font-bold uppercase leading-tight tracking-wide text-white group-hover:text-brand-gold">{product.name}</h3>
          <div className="mt-5 flex min-h-7 items-end justify-between gap-4">
            {product.price ? <div className="flex items-baseline gap-2"><span className="text-lg font-bold text-white">{formatMoney(product.price.priceCents)}</span>{product.price.compareAtPriceCents ? <span className="text-sm text-white/50 line-through">{formatMoney(product.price.compareAtPriceCents)}</span> : null}</div> : <span className="text-sm text-white/58">{product.dropState === "UPCOMING" && product.availabilityDate ? `Disponible desde ${formatDropDate(product.availabilityDate)}` : product.dropState === "ENDED" ? "Colección cerrada" : "No disponible actualmente"}</span>}
            <span aria-hidden="true" className="text-xl text-brand-gold">→</span>
          </div>
          {product.dropState === "AVAILABLE" && product.availabilityDate ? <p className="mt-3 text-xs font-semibold text-emerald-200">Disponible hasta {formatDropDate(product.availabilityDate)}</p> : null}
        </div>
      </Link>
    </article>
  );
}
