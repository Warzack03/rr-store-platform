import { requireAdmin } from "@/features/admin/auth/session";
import { Flash } from "@/features/admin/components/flash";
import { PageHeading } from "@/features/admin/components/page-heading";
import { createSize, updateSize } from "@/features/admin/server/catalog-actions";
import { getPrismaClient } from "@/server/db/client";

export default async function SizesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const [sizes, query] = await Promise.all([
    getPrismaClient().size.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }], include: { _count: { select: { productSizes: true } } } }),
    searchParams,
  ]);
  return <div className="space-y-6">
    <PageHeading title="Tallas" description="Catálogo reutilizable y orden de aparición." />
    <Flash searchParams={query} />
    <form action={createSize} className="grid gap-3 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-[1fr_9rem_auto]">
      <label className="text-sm font-semibold">Etiqueta<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" name="label" placeholder="Ej. XL" required /></label>
      <label className="text-sm font-semibold">Orden<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" defaultValue="0" min="0" name="sortOrder" type="number" /></label>
      <button className="self-end rounded bg-[var(--rr-navy-900)] px-4 py-2 font-semibold text-white" type="submit">Añadir talla</button>
    </form>
    <div className="space-y-3">
      {sizes.map((size) => <form action={updateSize} className="grid items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_8rem_8rem_auto]" key={size.id}>
        <input name="id" type="hidden" value={size.id} />
        <label className="text-sm font-semibold">Etiqueta<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" defaultValue={size.label} name="label" required /></label>
        <label className="text-sm font-semibold">Orden<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" defaultValue={size.sortOrder} min="0" name="sortOrder" type="number" /></label>
        <label className="flex h-10 items-center gap-2 text-sm"><input defaultChecked={size.isActive} name="isActive" type="checkbox" /> Activa</label>
        <button className="rounded border border-slate-300 px-4 py-2 font-semibold" type="submit">Guardar</button>
        <p className="text-xs text-slate-500 sm:col-span-4">Usada en {size._count.productSizes} producto(s).</p>
      </form>)}
    </div>
  </div>;
}
