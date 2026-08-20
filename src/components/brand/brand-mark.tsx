import Image from "next/image";

type BrandMarkProps = {
  priority?: boolean;
  size?: number;
};

export function BrandMark({ priority = false, size = 52 }: BrandMarkProps) {
  const height = Math.round(size * (782 / 690));

  return (
    <Image
      src="/brand/escudo-rising-raimon.webp"
      alt="Escudo de Rising Raimon"
      width={size}
      height={height}
      priority={priority}
      className="object-contain"
    />
  );
}
