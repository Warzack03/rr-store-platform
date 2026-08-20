import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="contenido-principal"
      className="flex min-h-screen items-center justify-center px-5 py-16"
    >
      <div className="max-w-2xl text-center">
        <p className="font-display text-8xl leading-none text-brand-gold/35 sm:text-9xl">
          404
        </p>
        <h1 className="mt-3 font-display text-6xl leading-none tracking-wide text-white sm:text-7xl">
          No encontramos esta página
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-white/68">
          Puede que la dirección haya cambiado o que esta página ya no esté
          disponible.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center border border-brand-gold bg-brand-gold px-6 py-3 font-heading font-bold uppercase tracking-[0.12em] text-brand-panel hover:bg-[#ffe19a]"
          >
            Ir al inicio
          </Link>
          <Link
            href="/productos"
            className="inline-flex min-h-12 items-center justify-center border border-white/30 px-6 py-3 font-heading font-bold uppercase tracking-[0.12em] text-white hover:border-brand-gold hover:text-brand-gold"
          >
            Ver productos
          </Link>
          <a
            href="https://risingraimon.es"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center px-3 py-3 font-heading font-bold uppercase tracking-[0.12em] text-white/70 hover:text-brand-gold"
          >
            Volver al club
          </a>
        </div>
      </div>
    </main>
  );
}
