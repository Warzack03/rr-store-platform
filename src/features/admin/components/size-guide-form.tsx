import { Flash } from "./flash";
import { saveSizeGuide } from "@/features/admin/server/catalog-actions";

type MediaOption = { id: string; originalName: string; storageKey: string };

export function SizeGuideForm({ guide, media, searchParams }: { guide?: { id: string; name: string; mediaAssetId: string; altText: string }; media: MediaOption[]; searchParams?: { ok?: string; error?: string } }) {
  return <div className="space-y-5"><Flash searchParams={searchParams} /><form action={saveSizeGuide} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
    {guide ? <input name="id" type="hidden" value={guide.id} /> : null}
    <label className="block text-sm font-semibold">Nombre<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" defaultValue={guide?.name} maxLength={191} name="name" required /></label>
    <label className="block text-sm font-semibold">Imagen<select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" defaultValue={guide?.mediaAssetId ?? ""} name="mediaAssetId" required><option value="">Selecciona una imagen</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.originalName}</option>)}</select></label>
    <label className="block text-sm font-semibold">Texto alternativo<input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" defaultValue={guide?.altText} maxLength={255} name="altText" required /></label>
    {media.length === 0 ? <p className="text-sm text-amber-700">Primero sube una imagen en Medios.</p> : null}
    <button className="rounded bg-[var(--rr-navy-900)] px-5 py-2 font-semibold text-white disabled:opacity-40" disabled={media.length === 0} type="submit">Guardar guía</button>
  </form></div>;
}
