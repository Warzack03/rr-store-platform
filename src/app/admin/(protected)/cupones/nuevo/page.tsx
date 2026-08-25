import { CouponForm } from "@/features/admin/components/coupon-form";
import { PageHeading } from "@/features/admin/components/page-heading";
import { getPrismaClient } from "@/server/db/client";

export default async function NewCouponPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [drops, query] = await Promise.all([
    getPrismaClient().drop.findMany({ where: { archivedAt: null }, orderBy: { startsAt: "desc" }, select: { id: true, title: true } }),
    searchParams,
  ]);
  return <div className="space-y-6"><PageHeading title="Nuevo cupón" description="Define el descuento y sus límites de uso." /><CouponForm drops={drops} searchParams={query} /></div>;
}
