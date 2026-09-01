import { ProductCard } from "./product-card";
import type { CatalogDrop } from "../types";

export function DropSection({ drop }: { drop: CatalogDrop }) {
  return (
    <section aria-label={`Productos de ${drop.title}`}>
      {drop.products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {drop.products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 3} />
          ))}
        </div>
      ) : (
        <p className="border border-white/10 bg-white/[0.025] px-5 py-8 text-white/62">
          Muy pronto anunciaremos las prendas disponibles.
        </p>
      )}
    </section>
  );
}
