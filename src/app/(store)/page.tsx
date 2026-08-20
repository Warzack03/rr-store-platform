import { BrandMark } from "@/components/brand/brand-mark";
import { ButtonLink } from "@/components/ui/button-link";

const highlights = [
  {
    number: "01",
    title: "Prendas del club",
    text: "Diseños oficiales para llevar los colores de Rising Raimon dentro y fuera del campo.",
  },
  {
    number: "02",
    title: "Personalización",
    text: "Tu nombre y dorsal para hacer cada equipación verdaderamente tuya.",
  },
  {
    number: "03",
    title: "Drops limitados",
    text: "Colecciones abiertas durante un tiempo concreto y fabricadas para el equipo.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-[80rem] px-5 py-10 md:px-8 md:py-16 xl:px-12 xl:py-20">
        <div className="brand-panel grid min-h-[33rem] items-center gap-10 px-6 py-12 md:grid-cols-[1.25fr_0.75fr] md:px-12 lg:px-16">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-4 font-heading text-sm font-bold uppercase tracking-[0.24em] text-brand-gold sm:text-base">
              Tienda oficial
            </p>
            <h1 className="font-display text-[clamp(3.75rem,12vw,8.5rem)] leading-[0.83] tracking-[0.015em] text-white">
              El próximo drop está en camino
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
              Estamos preparando nuevas prendas para que lleves el escudo de
              Rising Raimon como se merece.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/productos">Ver productos</ButtonLink>
              <ButtonLink
                href="https://risingraimon.es"
                external
                variant="secondary"
              >
                Volver al club
              </ButtonLink>
            </div>
          </div>

          <div className="relative z-10 mx-auto flex aspect-square w-full max-w-[18rem] items-center justify-center rounded-full border border-brand-gold/30 bg-brand-gold/[0.06] md:max-w-[22rem]">
            <div className="absolute inset-5 rounded-full border border-white/10" />
            <BrandMark priority size={230} />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="asi-sera-la-tienda"
        className="mx-auto max-w-[80rem] px-5 pb-16 md:px-8 md:pb-24 xl:px-12"
      >
        <div className="mb-8 flex items-end justify-between gap-6 border-b border-white/10 pb-5">
          <div>
            <p className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-brand-gold">
              Preparados para el siguiente partido
            </p>
            <h2
              id="asi-sera-la-tienda"
              className="mt-2 font-display text-4xl tracking-wide text-white sm:text-5xl"
            >
              Todo Rising Raimon
            </h2>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.number} className="bg-[#0b1b31] p-6 sm:p-8">
              <span className="font-display text-4xl text-brand-gold/45">
                {item.number}
              </span>
              <h3 className="mt-8 font-heading text-2xl font-bold uppercase tracking-wide text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65 sm:text-base">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
