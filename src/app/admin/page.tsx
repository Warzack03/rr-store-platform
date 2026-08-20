export default function AdminPage() {
  return (
    <div className="max-w-4xl">
      <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-gold">
        Panel de la tienda
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-6xl">
        Todo listo para empezar
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
        La administración de la tienda se habilitará paso a paso. Próximamente
        podrás preparar desde aquí los productos y drops de Rising Raimon.
      </p>

      <section
        aria-labelledby="estado-tienda"
        className="mt-10 border border-white/10 bg-[#0d2038] p-6 sm:p-8"
      >
        <h2
          id="estado-tienda"
          className="font-heading text-2xl font-bold uppercase tracking-wide"
        >
          Estado de la tienda
        </h2>
        <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-gold" aria-hidden="true" />
          <p className="text-sm font-medium text-white/75">
            Preparando el primer drop
          </p>
        </div>
      </section>
    </div>
  );
}
