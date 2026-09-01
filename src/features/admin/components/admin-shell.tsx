"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { endAdminSession } from "@/features/admin/auth/actions";

const navigation = [
  ["/admin", "Inicio"],
  ["/admin/drops", "Drops"],
  ["/admin/productos", "Productos"],
  ["/admin/pedidos", "Pedidos"],
  ["/admin/tallas", "Tallas"],
  ["/admin/guias-tallas", "Guías"],
  ["/admin/cupones", "Cupones"],
  ["/admin/medios", "Medios"],
  ["/admin/configuracion", "Configuración"],
  ["/admin/auditoria", "Auditoría"],
] as const;

function ThemeIcon({ theme }: { theme: "dark" | "light" }) {
  return theme === "dark" ? (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M10 17l5-5-5-5M15 12H3M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function AdminShell({
  email,
  initialTheme,
  children,
}: {
  email: string;
  initialTheme: "dark" | "light";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState(initialTheme);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.cookie = `rr-admin-theme=${nextTheme}; Path=/admin; Max-Age=31536000; SameSite=Lax`;
  }

  return (
    <div
      className="admin-shell min-h-screen bg-slate-100 text-slate-950"
      data-admin-theme={theme}
    >
      <header className="border-b border-slate-800 bg-[var(--rr-navy-950)] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-4 lg:flex-nowrap lg:px-8">
          <Link className="shrink-0 font-[family-name:var(--font-bebas-neue)] text-2xl tracking-widest text-[var(--rr-gold-400)]" href="/admin">
            RISING RAIMON · ADMIN
          </Link>
          <nav aria-label="Administración" className="admin-nav-scroll order-3 flex w-full gap-0.5 overflow-x-auto lg:order-none lg:min-w-0 lg:flex-1">
            {navigation.map(([href, label]) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  className={`whitespace-nowrap rounded px-3 py-2 text-sm font-semibold ${active ? "bg-[var(--rr-gold-400)] text-[var(--rr-navy-950)]" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                  href={href}
                  key={href}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm">
            <span className="hidden text-slate-400 2xl:inline">{email}</span>
            <button
              aria-label={`Activar modo ${theme === "dark" ? "claro" : "oscuro"}`}
              className="inline-flex size-10 items-center justify-center rounded border border-slate-600 text-slate-200 transition-colors hover:border-slate-400 hover:bg-slate-800 hover:text-white"
              onClick={toggleTheme}
              title={`Activar modo ${theme === "dark" ? "claro" : "oscuro"}`}
              type="button"
            >
              <ThemeIcon theme={theme} />
            </button>
            <form action={endAdminSession}>
              <button
                aria-label="Cerrar sesión"
                className="inline-flex size-10 items-center justify-center rounded border border-slate-600 text-slate-200 transition-colors hover:border-red-400 hover:bg-red-950/60 hover:text-red-200"
                title="Cerrar sesión"
                type="submit"
              >
                <SignOutIcon />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
