import { notFound } from "next/navigation";

import { requireAdmin } from "@/features/admin/auth/session";
import { PageHeading } from "@/features/admin/components/page-heading";
import { SizeGuideForm } from "@/features/admin/components/size-guide-form";
import { getPrismaClient } from "@/server/db/client";

export default async function EditGuidePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { id } = await params; const prisma = getPrismaClient();
  const [guide, media, query] = await Promise.all([prisma.sizeGuide.findUnique({ where: { id }, select: { id: true, name: true, mediaAssetId: true, altText: true } }), prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, originalName: true, storageKey: true } }), searchParams]);
  if (!guide) notFound();
  return <div className="space-y-6"><PageHeading title="Editar guía" description="Los cambios afectan a todos sus productos." /><SizeGuideForm guide={guide} media={media} searchParams={query} /></div>;
}
