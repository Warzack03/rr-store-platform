import { PageHeading } from "@/features/admin/components/page-heading";
import { ProductForm } from "@/features/admin/components/product-form";
import { getProductFormOptions } from "@/features/admin/server/product-form-data";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const [options, query] = await Promise.all([getProductFormOptions(), searchParams]); return <div className="space-y-6"><PageHeading title="Nuevo producto" description="Créalo como borrador y completa su contenido antes de publicarlo." /><ProductForm {...options} searchParams={query} /></div>; }
