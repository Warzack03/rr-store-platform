import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CatalogImage } from "@/features/catalog/components/catalog-image";
import { Countdown } from "@/features/catalog/components/countdown";
import { ProductCard } from "@/features/catalog/components/product-card";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { ProductConfigurator } from "@/features/cart/product-configurator";
import {
  dropStateLabels,
  formatDropDate,
  formatMoney,
} from "@/features/catalog/domain";
import {
  getPublicProduct,
  getPublicProductSlugs,
} from "@/features/catalog/server/catalog";
import type { CatalogProductDetail } from "@/features/catalog/types";
import { env } from "@/lib/env";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = await getPublicProductSlugs();
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const title = product.seoTitle ?? product.name;
  const description = product.seoDescription ?? product.shortDescription;
  const canonical = `/productos/${product.slug}`;
  const primaryImage = product.images[0];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: canonical,
      siteName: "Tienda Rising Raimon",
      title,
      description,
      images: primaryImage
        ? [
            {
              url: primaryImage.url,
              width: primaryImage.width,
              height: primaryImage.height,
              alt: primaryImage.altText,
            },
          ]
        : [
            {
              url: "/brand/escudo-rising-raimon.webp",
              alt: "Escudo de Rising Raimon",
            },
          ],
    },
  };
}

function ProductStructuredData({ product }: { product: CatalogProductDetail }) {
  const productUrl = new URL(`/productos/${product.slug}`, env.SITE_URL).toString();
  const drop = product.drop;
  const offerPriceCents = drop
    ? drop.publicPrice?.priceCents ?? drop.historicalPriceCents
    : null;
  const offer =
    drop && drop.state !== "UPCOMING" && offerPriceCents !== null
      ? {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "EUR",
          price: (offerPriceCents / 100).toFixed(2),
          availability:
            drop.state === "AVAILABLE"
              ? "https://schema.org/PreOrder"
              : "https://schema.org/Discontinued",
          ...(drop.state === "AVAILABLE"
            ? { priceValidUntil: drop.endsAt }
            : {}),
        }
      : undefined;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    url: productUrl,
    brand: { "@type": "Brand", name: "Rising Raimon" },
    image: product.images.map((image) =>
      new URL(image.url, env.SITE_URL).toString(),
    ),
    ...(offer ? { offers: offer } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
      }}
    />
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();

  const drop = product.drop;
  const isUpcoming = drop?.state === "UPCOMING";
  const isAvailable = drop?.state === "AVAILABLE";

  return (
    <>
      <ProductStructuredData product={product} />
      <article className="mx-auto max-w-[80rem] px-5 py-8 md:px-8 md:py-12 xl:px-12 xl:py-16">
        <div className="grid gap-9 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <ProductGallery images={product.images} productName={product.name} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-gold">
              {drop?.title ?? "Catálogo Rising Raimon"}
            </p>
            <h1 className="mt-3 font-display text-6xl leading-[0.88] tracking-wide text-white sm:text-7xl">
              {product.name}
            </h1>
            <p className="mt-5 text-base leading-7 text-white/70 sm:text-lg">
              {product.shortDescription}
            </p>

            {drop ? <div className="mt-7 border-y border-white/12 py-6">
              <p className="font-heading text-sm font-bold uppercase tracking-[0.17em] text-white/58">
                {dropStateLabels[drop.state]}
              </p>
              {isUpcoming || isAvailable ? (
                <div className="mt-4">
                  <Countdown
                    state={isUpcoming ? "UPCOMING" : "AVAILABLE"}
                    target={isUpcoming ? drop.startsAt : drop.endsAt}
                    initialNow={new Date().toISOString()}
                  />
                </div>
              ) : (
                <p className="mt-2 text-sm text-white/62">
                  Este drop finalizó el {formatDropDate(drop.endsAt)}.
                </p>
              )}
            </div> : <div className="mt-7 border-y border-white/12 py-6"><p className="font-heading text-sm font-bold uppercase tracking-[0.17em] text-white/58">No disponible actualmente</p><p className="mt-2 text-sm leading-6 text-white/62">Este producto forma parte del catálogo, pero no está incluido en ningún drop disponible o programado.</p></div>}

            <div className="mt-7">
              {drop?.publicPrice ? (
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-white">
                    {formatMoney(drop.publicPrice.priceCents)}
                  </p>
                  {drop.publicPrice.compareAtPriceCents ? (
                    <p className="text-lg text-white/45 line-through">
                      {formatMoney(drop.publicPrice.compareAtPriceCents)}
                    </p>
                  ) : null}
                </div>
              ) : drop && drop.historicalPriceCents !== null ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/48">
                    Precio durante el drop
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white/72">
                    {formatMoney(drop.historicalPriceCents)}
                  </p>
                </div>
              ) : (
                <p className="font-heading text-lg font-semibold uppercase tracking-wide text-white/68">
                  {drop?.state === "UPCOMING" ? "El precio estará disponible cuando abra el drop" : "Producto no disponible actualmente"}
                </p>
              )}
              <p className="mt-2 text-sm text-white/50">IVA incluido.</p>
            </div>

            {drop ? <Suspense
              fallback={
                <div className="mt-9 h-44 animate-pulse border border-white/10 bg-white/[0.025]" />
              }
            >
              <ProductConfigurator product={{ ...product, drop }} />
            </Suspense> : null}

            {product.sizeGuide ? (
              <details className="mt-6 border border-white/12 bg-white/[0.025]">
                <summary className="cursor-pointer px-4 py-3 font-heading text-base font-bold uppercase tracking-wide text-brand-gold marker:text-white/60">
                  Guía de tallas · {product.sizeGuide.name}
                </summary>
                <div className="border-t border-white/10 p-4">
                  <div className="relative aspect-[4/3] overflow-hidden bg-white">
                    <CatalogImage
                      image={product.sizeGuide.image}
                      sizes="(max-width: 767px) 90vw, 36rem"
                      className="object-contain"
                    />
                  </div>
                </div>
              </details>
            ) : null}

            <p className="mt-7 text-sm leading-6 text-white/60">
              ¿No encuentras tu talla? Escríbenos a{" "}
              <a
                href="mailto:risingraimon@gmail.com"
                className="font-semibold text-brand-gold underline underline-offset-4"
              >
                risingraimon@gmail.com
              </a>
            </p>
          </div>
        </div>

        <section aria-labelledby="descripcion" className="mt-16 border-t border-white/12 pt-10 md:mt-24">
          <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-gold">
            Detalles de la prenda
          </p>
          <h2
            id="descripcion"
            className="mt-2 font-display text-5xl tracking-wide text-white"
          >
            Diseñada para Rising Raimon
          </h2>
          <div className="mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-white/70">
            {product.description}
          </div>
        </section>

        {product.relatedProducts.length > 0 ? (
          <section aria-labelledby="relacionados" className="mt-16 md:mt-24">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-gold">
              Completa la colección
            </p>
            <h2
              id="relacionados"
              className="mt-2 font-display text-5xl tracking-wide text-white"
            >
              También en este drop
            </h2>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {product.relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </>
  );
}
