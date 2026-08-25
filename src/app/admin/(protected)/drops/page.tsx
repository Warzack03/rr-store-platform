import Link from "next/link";

import { Flash } from "@/features/admin/components/flash";
import { EmptyState, PageHeading } from "@/features/admin/components/page-heading";
import { archiveDrop, duplicateDrop } from "@/features/admin/server/drop-actions";
import { getPrismaClient } from "@/server/db/client";

type DropTiming = "ACTIVE" | "UPCOMING" | "ENDED" | "DRAFT" | "ARCHIVED";

const timingView: Record<DropTiming, { label: string; badge: string; card: string }> = {
  ACTIVE: { label: "Activo", badge: "border-emerald-400/45 bg-emerald-500/15 text-emerald-700", card: "border-l-4 border-l-emerald-400" },
  UPCOMING: { label: "Próximo", badge: "border-amber-400/45 bg-amber-500/15 text-amber-700", card: "border-l-4 border-l-amber-400" },
  ENDED: { label: "Finalizado", badge: "border-slate-400/45 bg-slate-500/15 text-slate-700", card: "border-l-4 border-l-slate-400" },
  DRAFT: { label: "Borrador", badge: "border-sky-400/45 bg-sky-500/15 text-sky-700", card: "border-l-4 border-l-sky-400" },
  ARCHIVED: { label: "Archivado", badge: "border-red-400/45 bg-red-500/15 text-red-700", card: "border-l-4 border-l-red-400 opacity-75" },
};

function getDropTiming(drop: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; startsAt: Date | null; endsAt: Date | null }, now: Date): DropTiming {
  if (drop.status === "ARCHIVED") return "ARCHIVED";
  if (drop.status === "DRAFT" || !drop.startsAt || !drop.endsAt) return "DRAFT";
  if (now < drop.startsAt) return "UPCOMING";
  if (now >= drop.endsAt) return "ENDED";
  return "ACTIVE";
}

const timingOrder: Record<DropTiming, number> = { ACTIVE: 0, UPCOMING: 1, DRAFT: 2, ENDED: 3, ARCHIVED: 4 };

export default async function DropsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [records, query] = await Promise.all([
    getPrismaClient().drop.findMany({ include: { _count: { select: { dropProducts: true, orders: true } } } }),
    searchParams,
  ]);
  const now = new Date();
  const drops = records
    .map((drop) => ({ ...drop, timing: getDropTiming(drop, now) }))
    .sort((left, right) => timingOrder[left.timing] - timingOrder[right.timing] || (right.startsAt?.valueOf() ?? 0) - (left.startsAt?.valueOf() ?? 0));
  const counts = drops.reduce<Record<DropTiming, number>>(
    (result, drop) => ({ ...result, [drop.timing]: result[drop.timing] + 1 }),
    { ACTIVE: 0, UPCOMING: 0, ENDED: 0, DRAFT: 0, ARCHIVED: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeading title="Drops" description="Campañas, calendario, surtido y precios." action={{ href: "/admin/drops/nuevo", label: "Nuevo drop" }} />
      <Flash searchParams={query} />
      {drops.length === 0 ? <EmptyState>Aún no hay drops.</EmptyState> : <>
        <div className="flex flex-wrap gap-3" aria-label="Resumen de drops">
          {(["ACTIVE", "UPCOMING", "DRAFT", "ENDED", "ARCHIVED"] as const).map((timing) => <div className={`rounded-lg border px-4 py-2 ${timingView[timing].badge}`} key={timing}><strong className="text-lg">{counts[timing]}</strong>{" "}<span className="text-sm font-semibold">{timingView[timing].label}</span></div>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {drops.map((drop) => { const view = timingView[drop.timing]; return <article className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${view.card}`} key={drop.id}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${view.badge}`}>{view.label}</span><h2 className="mt-3 text-xl font-bold">{drop.title}</h2><p className="text-sm text-slate-500">{drop.status === "PUBLISHED" ? "Publicado" : drop.status === "ARCHIVED" ? "Archivado" : "Sin publicar"}{drop.isPrimary ? " · Principal" : ""}</p></div><span className="text-sm text-slate-500">{drop._count.dropProducts} productos</span></div>
            <p className="mt-3 text-sm">{drop.startsAt ? drop.startsAt.toLocaleString("es-ES") : "Sin inicio"} — {drop.endsAt ? drop.endsAt.toLocaleString("es-ES") : "Sin fin"}</p>
            {drop.timing === "ENDED" ? <p className="mt-4 text-sm font-semibold text-slate-500">Drop cerrado · Solo lectura</p> : <div className="mt-4 flex flex-wrap gap-2"><Link className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold" href={`/admin/drops/${drop.id}`}>Editar</Link><Link className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold" href={`/admin/drops/${drop.id}/preview`}>Vista previa</Link><form action={duplicateDrop}><input name="id" type="hidden" value={drop.id} /><button className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold" type="submit">Duplicar</button></form>{drop.status !== "ARCHIVED" ? <form action={archiveDrop}><input name="id" type="hidden" value={drop.id} /><button className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" type="submit">Archivar</button></form> : null}</div>}
          </article>; })}
        </div>
      </>}
    </div>
  );
}
