import { DropForm } from "@/features/admin/components/drop-form";
import { PageHeading } from "@/features/admin/components/page-heading";
import { getDropFormOptions } from "@/features/admin/server/drop-form-data";
export default async function NewDropPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) { const [options, query] = await Promise.all([getDropFormOptions(), searchParams]); return <div className="space-y-6"><PageHeading title="Nuevo drop" description="Configura la campaña como borrador antes de publicarla." /><DropForm {...options} searchParams={query} /></div>; }
