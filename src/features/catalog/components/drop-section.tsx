import { Countdown } from "./countdown";
import { ProductCard } from "./product-card";
import { dropStateLabels, formatDropDate } from "../domain";
import type { CatalogDrop } from "../types";

export function DropSection({
  drop,
  headingLevel = 2,
}: {
  drop: CatalogDrop;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const anchor = `drop-${drop.slug ?? drop.id}`;

  return (
    <section id={anchor} aria-labelledby={`${anchor}-title`} className="scroll-mt-24">
      <div className="mb-7 flex flex-col justify-between gap-6 border-b border-white/12 pb-6 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-gold">
            {dropStateLabels[drop.state]}
          </p>
          <Heading
            id={`${anchor}-title`}
            className="mt-2 font-display text-5xl leading-none tracking-wide text-white sm:text-6xl"
          >
            {drop.title}
          </Heading>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
            {drop.shortText}
          </p>
        </div>

        {drop.state === "ENDED" ? (
          <p className="text-sm text-white/55">
            Finalizó el {formatDropDate(drop.endsAt)}
          </p>
        ) : (
          <Countdown
            state={drop.state}
            target={drop.state === "UPCOMING" ? drop.startsAt : drop.endsAt}
            initialNow={new Date().toISOString()}
          />
        )}
      </div>

      {drop.products.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {drop.products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 3} />
          ))}
        </div>
      ) : (
        <p className="border border-white/10 bg-white/[0.025] px-5 py-8 text-white/62">
          Muy pronto anunciaremos las prendas de este drop.
        </p>
      )}
    </section>
  );
}
