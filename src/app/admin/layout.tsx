import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false, noarchive: true },
};

const adminSections = [
  "Inicio",
  "Drops",
  "Productos",
  "Pedidos",
  "Cupones",
  "Guías de tallas",
  "Medios",
  "Configuración",
  "Auditoría",
] as const;

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#081322] text-white">
      <header className="border-b border-white/10 bg-[#07101d]">
        <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between px-5 md:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <BrandMark priority size={40} />
            <span className="font-heading text-lg font-bold uppercase tracking-[0.11em]">
              Administración
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-heading text-sm font-bold uppercase tracking-[0.1em] text-brand-gold hover:text-white"
          >
            Ver tienda
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[90rem] md:grid-cols-[15rem_1fr]">
        <aside className="border-b border-white/10 bg-[#0a182a] px-5 py-5 md:min-h-[calc(100vh-4.5rem)] md:border-r md:border-b-0 md:px-6 md:py-8">
          <nav aria-label="Navegación de administración">
            <ul className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
              {adminSections.map((section, index) => (
                <li key={section}>
                  <span
                    aria-current={index === 0 ? "page" : undefined}
                    className={`block whitespace-nowrap border-l-2 px-3 py-2.5 font-heading text-sm font-semibold uppercase tracking-[0.08em] ${
                      index === 0
                        ? "border-brand-gold bg-brand-gold/[0.08] text-brand-gold"
                        : "border-transparent text-white/48"
                    }`}
                  >
                    {section}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main id="contenido-principal" className="px-5 py-8 md:px-8 md:py-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
