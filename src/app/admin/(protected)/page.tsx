import Link from "next/link";

import { requireAdmin } from "@/features/admin/auth/session";
import { PageHeading } from "@/features/admin/components/page-heading";
import { getPrismaClient } from "@/server/db/client";

const orderLabels = { RECEIVED: "Recibidos", IN_PRODUCTION: "En producción", SHIPPED: "Enviados", DELIVERED: "Entregados", CANCELLED: "Cancelados" } as const;

export default async function AdminDashboard() {
  await requireAdmin();
  const prisma = getPrismaClient(); const now = new Date();
  const [currentDrop, upcomingDrop, productCount, mediaCount, orders] = await Promise.all([
    prisma.drop.findFirst({ where: { status: "PUBLISHED", archivedAt: null, startsAt: { lte: now }, endsAt: { gte: now } }, orderBy: [{ isPrimary: "desc" }, { startsAt: "asc" }], include: { _count: { select: { dropProducts: true } } } }),
    prisma.drop.findFirst({ where: { status: "PUBLISHED", archivedAt: null, startsAt: { gt: now } }, orderBy: { startsAt: "asc" }, include: { _count: { select: { dropProducts: true } } } }),
    prisma.product.count({ where: { status: { not: "ARCHIVED" } } }), prisma.mediaAsset.count(), prisma.order.groupBy({ by: ["status"], _count: { _all: true }, _sum: { totalCents: true } }),
  ]);
  const totalOrders = orders.reduce((sum, row) => sum + row._count._all, 0); const totalRevenue = orders.filter((row) => row.status !== "CANCELLED").reduce((sum, row) => sum + (row._sum.totalCents ?? 0), 0);
  return <div className="space-y-8"><PageHeading title="Panel" description="Estado operativo del catálogo y accesos rápidos." />
    <section className="grid gap-4 md:grid-cols-2">{[{ label: "Drop actual", value: currentDrop }, { label: "Próximo drop", value: upcomingDrop }].map(({ label, value }) => <article className="rounded-xl bg-[var(--rr-navy-950)] p-6 text-white shadow-sm" key={label}><p className="text-sm font-semibold uppercase tracking-wider text-[var(--rr-gold-400)]">{label}</p>{value ? <><h2 className="mt-2 text-2xl font-bold">{value.title}</h2><p className="mt-1 text-slate-300">{value._count.dropProducts} productos · {value.startsAt?.toLocaleString("es-ES")}</p><Link className="mt-5 inline-block rounded bg-[var(--rr-gold-400)] px-4 py-2 font-bold text-[var(--rr-navy-950)]" href={`/admin/drops/${value.id}`}>Editar drop</Link></> : <p className="mt-3 text-slate-300">No hay ningún drop {label === "Drop actual" ? "activo" : "programado"}.</p>}</article>)}</section>
    <section><h2 className="text-2xl font-bold">Resumen</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Productos activos" value={String(productCount)} /><Metric label="Imágenes" value={String(mediaCount)} /><Metric label="Pedidos registrados" value={String(totalOrders)} /><Metric label="Importe no cancelado" value={(totalRevenue / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} /></div></section>
    <section><h2 className="text-2xl font-bold">Pedidos por estado (solo lectura)</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(orderLabels).map(([status, label]) => <Metric key={status} label={label} value={String(orders.find((row) => row.status === status)?._count._all ?? 0)} />)}</div></section>
    <section><h2 className="text-2xl font-bold">Acciones rápidas</h2><div className="mt-4 flex flex-wrap gap-3"><Quick href="/admin/drops/nuevo">Nuevo drop</Quick><Quick href="/admin/productos/nuevo">Nuevo producto</Quick><Quick href="/admin/medios">Subir imagen</Quick><Quick href="/admin/guias-tallas/nueva">Nueva guía</Quick></div></section>
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
function Quick({ href, children }: { href: string; children: React.ReactNode }) { return <Link className="rounded border border-slate-300 bg-white px-4 py-3 font-semibold shadow-sm hover:border-slate-500" href={href}>{children}</Link>; }
