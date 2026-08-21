import Image from "next/image";

import { BrandMark } from "@/components/brand/brand-mark";

import type { CatalogMedia } from "../types";

type CatalogImageProps = {
  image: CatalogMedia | null;
  priority?: boolean;
  sizes: string;
  className?: string;
};

export function CatalogImage({
  image,
  priority = false,
  sizes,
  className = "object-cover",
}: CatalogImageProps) {
  if (!image) {
    return (
      <div className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,212,111,0.14),transparent_65%)]">
        <BrandMark priority={priority} size={126} />
      </div>
    );
  }

  return (
    <Image
      src={image.url}
      alt={image.altText}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}
