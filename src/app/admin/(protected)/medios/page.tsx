import Image from "next/image";

import { requireAdmin } from "@/features/admin/auth/session";
import { Flash } from "@/features/admin/components/flash";
import { EmptyState, PageHeading } from "@/features/admin/components/page-heading";
import { deleteMedia, uploadMedia } from "@/features/admin/server/catalog-actions";
import { getPrismaClient } from "@/server/db/client";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const [assets, query] = await Promise.all([getPrismaClient().mediaAsset.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { sizeGuides: true, productImages: true, dropHeroes: true, marketingDropProducts: true } } } }), searchParams]);
  return <div className="space-y-6"><PageHeading title="Medios" description="Biblioteca segura de JPG, PNG y WebP (máximo 8 MB)." /><Flash searchParams={query} />
    <form action={uploadMedia} className="grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto]" encType="multipart/form-data"><label className="text-sm font-semibold">Archivo<input accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full rounded border border-slate-300 px-3 py-2" name="file" required type="file" /></label><label className="text-sm font-semibold">Texto alternativo<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" maxLength={255} name="altText" /></label><button className="self-end rounded bg-[var(--rr-navy-900)] px-4 py-2 font-semibold text-white" type="submit">Subir imagen</button></form>
    {assets.length === 0 ? <EmptyState>No hay imágenes en la biblioteca.</EmptyState> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{assets.map((asset) => { const usages = Object.values(asset._count).reduce((sum, count) => sum + count, 0); return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" key={asset.id}><Image alt={asset.altText ?? ""} className="aspect-square w-full bg-slate-100 object-contain" height={asset.height} src={`/media/${asset.storageKey}`} unoptimized width={asset.width} /><div className="space-y-2 p-4"><p className="truncate font-semibold" title={asset.originalName}>{asset.originalName}</p><p className="text-xs text-slate-500">{asset.width} × {asset.height} · {(Number(asset.byteSize) / 1024).toFixed(0)} KB · {usages} uso(s)</p><form action={deleteMedia}><input name="id" type="hidden" value={asset.id} /><button className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40" disabled={usages > 0} type="submit">Eliminar</button></form></div></article>; })}</div>}
  </div>;
}
