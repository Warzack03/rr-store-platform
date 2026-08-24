import { notFound } from "next/navigation";

import { PageHeading } from "@/features/admin/components/page-heading";
import { ProductForm } from "@/features/admin/components/product-form";
import { getProductFormOptions } from "@/features/admin/server/product-form-data";
import { getPrismaClient } from "@/server/db/client";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) { const { id } = await params; const [product, options, query] = await Promise.all([getPrismaClient().product.findUnique({ where: { id }, include: { sizes: { orderBy: { sortOrder: "asc" } }, images: { orderBy: { sortOrder: "asc" } }, customizations: true, bundleComponents: { orderBy: { sortOrder: "asc" } } } }), getProductFormOptions(id), searchParams]); if (!product) notFound(); return <div className="space-y-6"><PageHeading title={product.name} description="Edita el catálogo maestro; el precio se configura dentro de cada drop." /><ProductForm {...options} product={product} searchParams={query} /></div>; }
