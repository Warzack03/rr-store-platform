import Link from "next/link";

import { requireAdmin } from "@/features/admin/auth/session";
import { Flash } from "@/features/admin/components/flash";
import { EmptyState, PageHeading } from "@/features/admin/components/page-heading";
import { archiveProduct, duplicateProduct } from "@/features/admin/server/product-actions";
import { getPrismaClient } from "@/server/db/client";

const labels = { DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado" } as const;
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const [products, query] = await Promise.all([getPrismaClient().product.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { dropProducts: true, images: true, sizes: true } } } }), searchParams]);
  return <div className="space-y-6"><PageHeading title="Productos" description="Catálogo maestro, personalizaciones y packs." action={{ href: "/admin/productos/nuevo", label: "Nuevo producto" }} /><Flash searchParams={query} />
    {products.length === 0 ? <EmptyState>Aún no hay productos.</EmptyState> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Producto</th><th className="p-4">Tipo</th><th className="p-4">Estado</th><th className="p-4">Contenido</th><th className="p-4">Acciones</th></tr></thead><tbody>{products.map((product) => <tr className="border-t border-slate-100" key={product.id}><td className="p-4"><strong>{product.name}</strong><br /><span className="text-slate-500">/{product.slug}</span></td><td className="p-4">{product.type === "BUNDLE" ? "Pack" : "Simple"}</td><td className="p-4">{labels[product.status]}</td><td className="p-4">{product._count.images} imágenes · {product._count.sizes} tallas · {product._count.dropProducts} drops</td><td className="p-4"><div className="flex gap-2"><Link className="rounded border border-slate-300 px-3 py-2 font-semibold" href={`/admin/productos/${product.id}`}>Editar</Link><form action={duplicateProduct}><input name="id" type="hidden" value={product.id} /><button className="rounded border border-slate-300 px-3 py-2 font-semibold" type="submit">Duplicar</button></form>{product.status !== "ARCHIVED" ? <form action={archiveProduct}><input name="id" type="hidden" value={product.id} /><button className="rounded border border-red-300 px-3 py-2 font-semibold text-red-700" type="submit">Archivar</button></form> : null}</div></td></tr>)}</tbody></table></div>}
  </div>;
}
