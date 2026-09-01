import Link from "next/link";

import { requireAdmin } from "@/features/admin/auth/session";
import { PageHeading } from "@/features/admin/components/page-heading";
import { formatMoney } from "@/features/catalog/domain";
import { OrderStatusBadge } from "@/features/orders/components/order-badges";
import { getPrismaClient } from "@/server/db/client";

function formatDate(value: Date) {
  return value.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Madrid" });
}

export default async function AdminDashboard() {
  await requireAdmin();
  const prisma = getPrismaClient();
  const now = new Date();
  const [currentDrop, upcomingDrop, productCount, mediaCount, latestOrders] = await Promise.all([
    prisma.drop.findFirst({ where: { status: "PUBLISHED", archivedAt: null, startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: [{ isPrimary: "desc" }, { startsAt: "asc" }], include: { _count: { select: { dropProducts: true } } } }),
    prisma.drop.findFirst({ where: { status: "PUBLISHED", archivedAt: null, startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, include: { _count: { select: { dropProducts: true } } } }),
    prisma.product.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.mediaAsset.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { drop: { select: { title: true } } } }),
  ]);
  const currentOrders = currentDrop ? await prisma.order.groupBy({
    by: ["status"],
    where: { dropId: currentDrop.id },
    _count: { _all: true },
    _sum: { totalCents: true },
  }) : [];
  const count = (status: "RECEIVED" | "IN_PRODUCTION" | "SHIPPED") => currentOrders.find((row) => row.status === status)?._count._all ?? 0;
  const currentRevenue = currentOrders.filter((row) => row.status !== "CANCELLED").reduce((sum, row) => sum + (row._sum.totalCents ?? 0), 0);

  return (
    <div className="space-y-8">
      <PageHeading title="Panel" description="Estado operativo del drop y accesos rápidos." />
      <section className="grid gap-4 md:grid-cols-2">
        {[{ label: "Drop actual", value: currentDrop }, { label: "Próximo drop", value: upcomingDrop }].map(({ label, value }) => <article className="rounded-xl bg-[var(--rr-navy-950)] p-6 text-white shadow-sm" key={label}><p className="text-sm font-semibold uppercase tracking-wider text-[var(--rr-gold-400)]">{label}</p>{value ? <><h2 className="mt-2 text-2xl font-bold">{value.title}</h2><p className="mt-1 text-slate-300">{value._count.dropProducts} productos · {value.startsAt ? formatDate(value.startsAt) : "Sin fecha"}</p><Link className="mt-5 inline-block rounded bg-[var(--rr-gold-400)] px-4 py-2 font-bold text-[var(--rr-navy-950)]" href={`/admin/drops/${value.id}`}>{label === "Drop actual" ? "Ver drop" : "Editar drop"}</Link></> : <p className="mt-3 text-slate-300">No hay ningún drop {label === "Drop actual" ? "activo" : "programado"}.</p>}</article>)}
      </section>
      <section><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Operación del drop actual</h2><p className="mt-1 text-sm text-slate-500">{currentDrop?.title ?? "Sin drop activo"}</p></div><Link className="rounded border border-slate-300 bg-white px-4 py-2 font-semibold" href="/admin/pedidos">Gestionar pedidos</Link></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Recibidos" value={String(count("RECEIVED"))} /><Metric label="En fabricación" value={String(count("IN_PRODUCTION"))} /><Metric label="Enviados" value={String(count("SHIPPED"))} /><Metric label="Importe del drop" value={formatMoney(currentRevenue)} /></div></section>
      <section><h2 className="text-2xl font-bold">Últimos pedidos</h2>{latestOrders.length > 0 ? <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Pedido</th><th className="p-4">Cliente</th><th className="p-4">Drop</th><th className="p-4">Total</th><th className="p-4">Estado</th><th className="p-4"></th></tr></thead><tbody>{latestOrders.map((order) => <tr className="border-t border-slate-100" key={order.id}><td className="p-4 font-bold">#{order.number}<span className="block text-xs font-normal text-slate-500">{formatDate(order.createdAt)}</span></td><td className="p-4">{order.firstName} {order.lastName}</td><td className="p-4">{order.drop.title}</td><td className="p-4 font-semibold">{formatMoney(order.totalCents)}</td><td className="p-4"><OrderStatusBadge status={order.status} /></td><td className="p-4"><Link className="font-semibold underline" href={`/admin/pedidos/${order.number}`}>Abrir</Link></td></tr>)}</tbody></table></div> : <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">Todavía no hay pedidos.</div>}</section>
      <section><h2 className="text-2xl font-bold">Catálogo</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Metric label="Productos activos" value={String(productCount)} /><Metric label="Imágenes" value={String(mediaCount)} /></div></section>
      <section><h2 className="text-2xl font-bold">Acciones rápidas</h2><div className="mt-4 flex flex-wrap gap-3"><Quick href="/admin/pedidos">Ver pedidos</Quick><Quick href="/admin/drops/nuevo">Nuevo drop</Quick><Quick href="/admin/productos/nuevo">Nuevo producto</Quick><Quick href="/admin/medios">Subir imagen</Quick></div></section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}

function Quick({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className="rounded border border-slate-300 bg-white px-4 py-3 font-semibold shadow-sm hover:border-slate-500" href={href}>{children}</Link>;
}
