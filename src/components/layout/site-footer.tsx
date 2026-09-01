import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";

type SiteFooterProps = {
  storeName?: string;
  supportEmail?: string;
};

export function SiteFooter({
  storeName = "Tienda Rising Raimon",
  supportEmail = "risingraimon@gmail.com",
}: SiteFooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#070f1d]">
      <div className="mx-auto max-w-[80rem] px-5 py-10 md:px-8 xl:px-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size={42} />
            <div>
              <p className="font-display text-2xl tracking-wide text-brand-gold">
                {storeName}
              </p>
              <p className="text-sm text-white/60">Tienda oficial del club</p>
            </div>
          </div>

          <nav aria-label="Enlaces de la tienda" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
            <a href="https://risingraimon.es" target="_blank" rel="noreferrer" className="hover:text-brand-gold">Ir a Rising Raimon</a>
            <Link href="/productos" className="hover:text-brand-gold">Productos</Link>
            <a className="hover:text-brand-gold" href={`mailto:${supportEmail}`}>Soporte</a>
          </nav>
        </div>
        <nav aria-label="Información legal" className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-xs leading-5 text-white/55">
          <Link className="hover:text-brand-gold" href="/aviso-legal">Aviso legal</Link>
          <Link className="hover:text-brand-gold" href="/privacidad">Privacidad</Link>
          <Link className="hover:text-brand-gold" href="/cookies">Cookies</Link>
          <Link className="hover:text-brand-gold" href="/condiciones-de-compra">Condiciones de compra</Link>
          <Link className="hover:text-brand-gold" href="/envios">Envíos</Link>
          <Link className="hover:text-brand-gold" href="/cambios-y-devoluciones">Cambios y devoluciones</Link>
          <span className="sm:ml-auto">© {new Date().getFullYear()} {storeName}</span>
        </nav>
      </div>
    </footer>
  );
}
