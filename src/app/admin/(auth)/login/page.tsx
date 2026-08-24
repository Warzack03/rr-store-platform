import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand/brand-mark";
import { LoginForm } from "@/features/admin/auth/login-form";
import { getVerifiedAdmin } from "@/features/admin/auth/session";

export default async function AdminLoginPage() {
  if (await getVerifiedAdmin()) redirect("/admin");

  return (
    <main
      id="contenido-principal"
      className="flex min-h-screen items-center justify-center bg-[#07101d] px-5 py-12"
    >
      <div className="w-full max-w-md border border-white/12 bg-[#0b1b31] p-6 shadow-2xl sm:p-9">
        <div className="flex items-center gap-3">
          <BrandMark priority size={48} />
          <div>
            <p className="font-display text-3xl tracking-wide text-brand-gold">
              Rising Raimon
            </p>
            <p className="text-sm text-white/55">Administración de la tienda</p>
          </div>
        </div>
        <h1 className="mt-9 font-display text-5xl tracking-wide text-white">
          Iniciar sesión
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Accede con la cuenta administradora de la tienda.
        </p>
        <LoginForm />
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-white/55 hover:text-brand-gold"
        >
          ← Volver a la tienda
        </Link>
      </div>
    </main>
  );
}
