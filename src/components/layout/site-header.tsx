import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { CartCount } from "@/features/cart/cart-count";

const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/carrito", label: "Carrito" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071629e8] backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-[80rem] items-center justify-between gap-4 px-5 md:px-8 xl:px-12">
        <Link
          href="/"
          aria-label="Ir al inicio de la tienda Rising Raimon"
          className="flex shrink-0 items-center gap-2.5"
        >
          <BrandMark priority size={44} />
          <span className="hidden font-display text-[2rem] leading-none tracking-[0.035em] text-brand-gold sm:inline">
            Rising Raimon
          </span>
        </Link>

        <nav aria-label="Navegación principal">
          <ul className="flex items-center gap-1 sm:gap-2">
            {navigation.map((item) => (
              <li
                key={item.href}
                className={item.href === "/" ? "hidden sm:block" : undefined}
              >
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center px-2 font-heading text-sm font-semibold uppercase tracking-[0.08em] text-white/80 hover:text-brand-gold sm:px-3 sm:text-base"
                >
                  {item.label}
                  {item.href === "/carrito" ? <CartCount /> : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
