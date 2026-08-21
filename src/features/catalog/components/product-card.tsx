import Link from "next/link";

import { dropStateLabels, formatMoney } from "../domain";
import type { CatalogProductCard } from "../types";
import { CatalogImage } from "./catalog-image";

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProductCard;
  priority?: boolean;
}) {
  return (
    <article className="group min-w-0 border border-white/12 bg-[#0b1b31]">
      <Link
        href={`/productos/${product.slug}`}
        className="block focus-visible:outline-offset-4"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#0e223b]">
          <CatalogImage
            image={product.image}
            priority={priority}
            sizes="(max-width: 767px) 92vw, (max-width: 1279px) 44vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none"
          />
          <span className="absolute left-3 top-3 border border-white/15 bg-[#071629e8] px-3 py-1.5 font-heading text-xs font-bold uppercase tracking-[0.12em] text-white">
            {dropStateLabels[product.dropState]}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
            {product.dropTitle}
          </p>
          <h3 className="mt-2 font-heading text-2xl font-bold uppercase leading-tight tracking-wide text-white group-hover:text-brand-gold">
            {product.name}
          </h3>
          <div className="mt-5 flex min-h-7 items-end justify-between gap-4">
            {product.price ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">
                  {formatMoney(product.price.priceCents)}
                </span>
                {product.price.compareAtPriceCents ? (
                  <span className="text-sm text-white/50 line-through">
                    {formatMoney(product.price.compareAtPriceCents)}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-sm text-white/58">
                {product.dropState === "UPCOMING"
                  ? "Precio disponible al abrir"
                  : "Colección cerrada"}
              </span>
            )}
            <span aria-hidden="true" className="text-xl text-brand-gold">
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
