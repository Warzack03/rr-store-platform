import { notFound } from "next/navigation";

import { CouponForm } from "@/features/admin/components/coupon-form";
import { PageHeading } from "@/features/admin/components/page-heading";
import { getPrismaClient } from "@/server/db/client";

export default async function EditCouponPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const [coupon, drops, query] = await Promise.all([
    getPrismaClient().coupon.findUnique({ where: { id } }),
    getPrismaClient().drop.findMany({ where: { archivedAt: null }, orderBy: { startsAt: "desc" }, select: { id: true, title: true } }),
    searchParams,
  ]);
  if (!coupon) notFound();
  return <div className="space-y-6"><PageHeading title={coupon.code} description="Edita las reglas y vigencia del cupón." /><CouponForm coupon={coupon} drops={drops} searchParams={query} /></div>;
}
