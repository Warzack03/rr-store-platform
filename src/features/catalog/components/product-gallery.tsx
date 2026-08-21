"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { BrandMark } from "@/components/brand/brand-mark";

import type { CatalogMedia } from "../types";

export function ProductGallery({
  images,
  productName,
}: {
  images: CatalogMedia[];
  productName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [firstImage] = images;

  if (!firstImage) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center border border-white/12 bg-[#0e223b]">
        <BrandMark priority size={180} />
      </div>
    );
  }

  const activeImage = images[activeImageIndex] ?? firstImage;

  return (
    <div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => {
              setActiveImageIndex(index);
              const dialog = dialogRef.current;
              if (dialog) dialog.showModal();
            }}
            className={`group relative aspect-[4/5] w-[88%] shrink-0 snap-center overflow-hidden border border-white/12 bg-[#0e223b] text-left sm:w-[72%] md:w-auto ${index === 0 ? "md:col-span-2" : ""}`}
            aria-label={`Ampliar imagen ${index + 1} de ${productName}`}
          >
            <Image
              src={image.url}
              alt={image.altText}
              fill
              priority={index === 0}
              sizes={index === 0 ? "(max-width: 1023px) 100vw, 55vw" : "(max-width: 1023px) 70vw, 27vw"}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transform-none"
            />
            <span className="absolute bottom-3 right-3 bg-[#071629df] px-3 py-2 font-heading text-xs font-bold uppercase tracking-wider text-white">
              Ampliar
            </span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="m-auto h-[100dvh] w-screen max-w-none bg-[#050b15f5] p-0 text-white backdrop:bg-black/85"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="flex min-h-full flex-col px-4 pb-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="inline-flex min-h-11 items-center border border-white/25 px-4 font-heading font-bold uppercase tracking-wider text-white hover:border-brand-gold hover:text-brand-gold"
            >
              Cerrar
            </button>
          </div>
          <div className="relative flex-1">
            <Image
              src={activeImage.url}
              alt={activeImage.altText}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((index) =>
                    index === 0 ? images.length - 1 : index - 1,
                  )
                }
                className="inline-flex min-h-11 items-center border border-white/25 px-4 font-heading font-bold uppercase tracking-wider text-white hover:border-brand-gold hover:text-brand-gold"
              >
                Anterior
              </button>
              <p className="text-sm text-white/65">
                {activeImageIndex + 1} de {images.length}
              </p>
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((index) => (index + 1) % images.length)
                }
                className="inline-flex min-h-11 items-center border border-white/25 px-4 font-heading font-bold uppercase tracking-wider text-white hover:border-brand-gold hover:text-brand-gold"
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
