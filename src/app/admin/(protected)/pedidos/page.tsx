import Link from "next/link";

import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/features/admin/auth/session";
import { Flash } from "@/features/admin/components/flash";
import { EmptyState, PageHeading } from "@/features/admin/components/page-heading";
import { formatMoney } from "@/features/catalog/domain";
import { FinancialStatusBadge, OrderStatusBadge } from "@/features/orders/components/order-badges";
import { orderStatuses, orderStatusLabels, type OrderStatus } from "@/features/orders/domain";
import { batchMarkInProduction } from "@/features/orders/server/order-actions";
import { getPrismaClient } from "@/server/db/client";

type Query = { q?: string; status?: string; dropId?: string; ok?: string; error?: string };

function formatDate(value: Date) {
  return value.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Madrid" });
}

function selectedStatus(value?: string): OrderStatus | undefined {
  return orderStatuses.includes(value as OrderStatus) ? value as OrderStatus : undefined;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Query> }) {
  await requireAdmin();
  const query = await searchParams;
  const q = query.q?.trim().slice(0, 191) ?? "";
  const status = selectedStatus(query.status);
  const dropId = query.dropId?.trim().slice(0, 30) || undefined;
  const numericQuery = Number(q.replace(/^#/, ""));
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(dropId ? { dropId } : {}),
    ...(q ? {
      OR: [
        ...(Number.isInteger(numericQuery) && numericQuery > 0 ? [{ number: numericQuery }] : []),
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
      ],
    } : {}),
  };
  const prisma = getPrismaClient();
  const [orders, drops, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        drop: { select: { title: true } },
        shipment: { select: { trackingNumber: true, shippedAt: true } },
        payment: { select: { status: true } },
      },
    }),
    prisma.drop.findMany({ where: { orders: { some: {} } }, orderBy: { startsAt: "desc" }, select: { id: true, title: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeading title="Pedidos" description="Gestiona fabricación, envío y entrega sin salir del historial del pedido." />
      <Flash searchParams={query} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Pedidos por estado">
        {orderStatuses.map((itemStatus) => <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={itemStatus}><p className="text-sm text-slate-500">{orderStatusLabels[itemStatus]}</p><p className="mt-1 text-2xl font-bold">{statusCounts.find((row) => row.status === itemStatus)?._count._all ?? 0}</p></div>)}
      </section>
      <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(15rem,1fr)_14rem_16rem_auto] lg:items-end" method="get">
        <label className="text-sm font-semibold">Buscar
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal" defaultValue={q} name="q" placeholder="Número, nombre o email" type="search" />
        </label>
        <label className="text-sm font-semibold">Estado
          <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal" defaultValue={status ?? ""} name="status"><option value="">Todos</option>{orderStatuses.map((value) => <option key={value} value={value}>{orderStatusLabels[value]}</option>)}</select>
        </label>
        <label className="text-sm font-semibold">Drop
          <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal" defaultValue={dropId ?? ""} name="dropId"><option value="">Todos</option>{drops.map((drop) => <option key={drop.id} value={drop.id}>{drop.title}</option>)}</select>
        </label>
        <div className="flex gap-2"><button className="rounded bg-[var(--rr-navy-900)] px-4 py-2 font-semibold text-white" type="submit">Filtrar</button><Link className="rounded border border-slate-300 px-4 py-2 font-semibold" href="/admin/pedidos">Limpiar</Link></div>
      </form>
      {orders.length === 0 ? <EmptyState>No hay pedidos que coincidan con estos filtros.</EmptyState> : (
        <form action={batchMarkInProduction} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">Mostrando {orders.length}{orders.length === 200 ? "+" : ""} pedidos. Selecciona pedidos recibidos para preparar fabricación.</p>
            <div className="flex flex-wrap gap-2">
              {dropId ? <Link className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold" href={`/admin/pedidos/exportar?dropId=${encodeURIComponent(dropId)}`}>Exportar fabricación · CSV</Link> : <span className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-500">Selecciona un drop para exportar</span>}
              <button className="rounded bg-[var(--rr-gold-400)] px-4 py-2 text-sm font-bold text-[var(--rr-navy-950)]" type="submit">Marcar selección en fabricación</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr><th className="p-4"><span className="sr-only">Seleccionar</span></th><th className="p-4">Pedido</th><th className="p-4">Fecha</th><th className="p-4">Cliente</th><th className="p-4">Total</th><th className="p-4">Drop</th><th className="p-4">Estado</th><th className="p-4">Pago</th><th className="p-4">Entrega</th><th className="p-4">Acción</th></tr></thead>
              <tbody>{orders.map((order) => <tr className="border-t border-slate-100" key={order.id}>
                <td className="p-4">{order.status === "RECEIVED" ? <input aria-label={`Seleccionar pedido ${order.number}`} name="orderIds" type="checkbox" value={order.id} /> : null}</td>
                <td className="p-4 font-bold">#{order.number}</td><td className="p-4 whitespace-nowrap">{formatDate(order.createdAt)}</td><td className="p-4"><strong>{order.firstName} {order.lastName}</strong><span className="block text-xs text-slate-500">{order.email}</span></td><td className="p-4 font-semibold">{formatMoney(order.totalCents)}</td><td className="p-4">{order.drop.title}</td><td className="p-4"><OrderStatusBadge status={order.status} /></td><td className="p-4">{order.payment ? <FinancialStatusBadge status={order.payment.status} /> : <span className="text-red-700">Sin pago</span>}</td><td className="p-4">{order.shipment?.shippedAt ? <>{order.shipment.trackingNumber ? <span className="font-semibold">{order.shipment.trackingNumber}</span> : "Enviado sin tracking"}</> : "Pendiente"}</td><td className="p-4"><Link className="rounded border border-slate-300 px-3 py-2 font-semibold" href={`/admin/pedidos/${order.number}`}>Abrir</Link></td>
              </tr>)}</tbody>
            </table>
          </div>
        </form>
      )}
    </div>
  );
}
