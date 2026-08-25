import Link from "next/link";

import { requireAdmin } from "@/features/admin/auth/session";
import { Flash } from "@/features/admin/components/flash";
import { EmptyState, PageHeading } from "@/features/admin/components/page-heading";
import { archiveCoupon } from "@/features/admin/server/coupon-actions";
import { getPrismaClient } from "@/server/db/client";

function valueLabel(type: "PERCENT" | "FIXED", value: number) {
  return type === "PERCENT"
    ? `${value}%`
    : (value / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const [coupons, query] = await Promise.all([
    getPrismaClient().coupon.findMany({
      orderBy: { updatedAt: "desc" },
      include: { drop: { select: { title: true } }, _count: { select: { redemptions: true } } },
    }),
    searchParams,
  ]);
  return <div className="space-y-6"><PageHeading title="Cupones" description="Descuentos globales o limitados a un drop." action={{ href: "/admin/cupones/nuevo", label: "Nuevo cupón" }} /><Flash searchParams={query} />
    {coupons.length === 0 ? <EmptyState>Aún no hay cupones.</EmptyState> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Código</th><th className="p-4">Descuento</th><th className="p-4">Ámbito</th><th className="p-4">Usos</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr></thead><tbody>{coupons.map((coupon) => <tr className="border-t border-slate-100" key={coupon.id}><td className="p-4 font-bold">{coupon.code}</td><td className="p-4">{valueLabel(coupon.type, coupon.value)}</td><td className="p-4">{coupon.drop?.title ?? "Todos los drops"}</td><td className="p-4">{coupon._count.redemptions}{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}</td><td className="p-4">{coupon.archivedAt ? "Archivado" : coupon.isActive ? "Activo" : "Inactivo"}</td><td className="p-4"><div className="flex gap-2"><Link className="rounded border border-slate-300 px-3 py-2 font-semibold" href={`/admin/cupones/${coupon.id}`}>Editar</Link>{!coupon.archivedAt ? <form action={archiveCoupon}><input name="id" type="hidden" value={coupon.id} /><button className="rounded border border-red-300 px-3 py-2 font-semibold text-red-700" type="submit">Archivar</button></form> : null}</div></td></tr>)}</tbody></table></div>}
  </div>;
}
