import Link from "next/link";
import Image from "next/image";

import { requireAdmin } from "@/features/admin/auth/session";
import { Flash } from "@/features/admin/components/flash";
import { EmptyState, PageHeading } from "@/features/admin/components/page-heading";
import { deleteSizeGuide } from "@/features/admin/server/catalog-actions";
import { getPrismaClient } from "@/server/db/client";

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const [guides, query] = await Promise.all([getPrismaClient().sizeGuide.findMany({ orderBy: { updatedAt: "desc" }, include: { mediaAsset: true, _count: { select: { products: true } } } }), searchParams]);
  return <div className="space-y-6">
    <PageHeading title="Guías de tallas" description="Imágenes de medidas asociables a los productos." action={{ href: "/admin/guias-tallas/nueva", label: "Nueva guía" }} />
    <Flash searchParams={query} />
    {guides.length === 0 ? <EmptyState>Aún no hay guías de tallas.</EmptyState> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{guides.map((guide) => <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={guide.id}>
      <Image alt={guide.altText} className="mb-4 aspect-video w-full rounded-lg bg-slate-100 object-contain" height={guide.mediaAsset.height} src={`/media/${guide.mediaAsset.storageKey}`} unoptimized width={guide.mediaAsset.width} />
      <h2 className="text-lg font-bold">{guide.name}</h2><p className="text-sm text-slate-500">{guide._count.products} producto(s)</p>
      <div className="mt-4 flex gap-2"><Link className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold" href={`/admin/guias-tallas/${guide.id}`}>Editar</Link>
      <form action={deleteSizeGuide}><input name="id" type="hidden" value={guide.id} /><button className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40" disabled={guide._count.products > 0} type="submit">Eliminar</button></form></div>
    </article>)}</div>}
  </div>;
}
