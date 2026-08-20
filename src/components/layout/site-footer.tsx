import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#070f1d]">
      <div className="mx-auto flex max-w-[80rem] flex-col gap-8 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8 xl:px-12">
        <div className="flex items-center gap-3">
          <BrandMark size={42} />
          <div>
            <p className="font-display text-2xl tracking-wide text-brand-gold">
              Rising Raimon
            </p>
            <p className="text-sm text-white/60">Tienda oficial del club</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-white/70 sm:flex-row sm:items-center sm:gap-6">
          <a
            href="https://risingraimon.es"
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand-gold"
          >
            Ir a Rising Raimon
          </a>
          <Link href="/productos" className="hover:text-brand-gold">
            Productos
          </Link>
          <span>© {new Date().getFullYear()} Rising Raimon</span>
        </div>
      </div>
    </footer>
  );
}
