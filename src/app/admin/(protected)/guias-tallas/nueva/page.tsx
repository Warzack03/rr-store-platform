import { requireAdmin } from "@/features/admin/auth/session";
import { PageHeading } from "@/features/admin/components/page-heading";
import { SizeGuideForm } from "@/features/admin/components/size-guide-form";
import { getPrismaClient } from "@/server/db/client";

export default async function NewGuidePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const [media, query] = await Promise.all([getPrismaClient().mediaAsset.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, originalName: true, storageKey: true } }), searchParams]);
  return <div className="space-y-6"><PageHeading title="Nueva guía" description="Asocia una imagen clara con sus medidas." /><SizeGuideForm media={media} searchParams={query} /></div>;
}
