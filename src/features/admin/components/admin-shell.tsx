"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { endAdminSession } from "@/features/admin/auth/actions";

const navigation = [
  ["/admin", "Inicio"],
  ["/admin/drops", "Drops"],
  ["/admin/productos", "Productos"],
  ["/admin/tallas", "Tallas"],
  ["/admin/guias-tallas", "Guías"],
  ["/admin/medios", "Medios"],
  ["/admin/auditoria", "Auditoría"],
] as const;

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
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-4 py-4 lg:px-8">
          <Link className="font-[family-name:var(--font-bebas-neue)] text-2xl tracking-widest text-[var(--rr-gold-400)]" href="/admin">
            RISING RAIMON · ADMIN
          </Link>
          <nav aria-label="Administración" className="order-3 flex w-full gap-1 overflow-x-auto lg:order-none lg:w-auto lg:flex-1">
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
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-400 xl:inline">{email}</span>
            <button
              aria-label={`Activar modo ${theme === "dark" ? "claro" : "oscuro"}`}
              aria-pressed={theme === "dark"}
              className="inline-flex items-center gap-2 rounded border border-slate-600 px-3 py-2 hover:border-slate-400"
              onClick={toggleTheme}
              title={`Activar modo ${theme === "dark" ? "claro" : "oscuro"}`}
              type="button"
            >
              <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
              <span className="hidden sm:inline">
                {theme === "dark" ? "Claro" : "Oscuro"}
              </span>
            </button>
            <Link className="rounded border border-slate-600 px-3 py-2 hover:border-slate-400" href="/" target="_blank">Ver tienda</Link>
            <form action={endAdminSession}>
              <button className="rounded border border-slate-600 px-3 py-2 hover:border-slate-400" type="submit">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
