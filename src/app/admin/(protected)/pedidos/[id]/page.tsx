import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/features/admin/auth/session";
import { Flash } from "@/features/admin/components/flash";
import { PageHeading } from "@/features/admin/components/page-heading";
import { formatMoney } from "@/features/catalog/domain";
import { resendOrderEmail } from "@/features/email/server/email-actions";
import { FinancialStatusBadge, OrderStatusBadge } from "@/features/orders/components/order-badges";
import { ConfirmSubmitButton } from "@/features/orders/components/confirm-submit-button";
import { orderStatusLabels } from "@/features/orders/domain";
import {
  cancelOrder,
  markOrderDelivered,
  markOrderInProduction,
  markOrderShipped,
  saveInternalNotes,
} from "@/features/orders/server/order-actions";
import { getPrismaClient } from "@/server/db/client";

type Query = { ok?: string; error?: string };

const refundLabels = { PENDING: "Pendiente", SUCCEEDED: "Confirmado", FAILED: "Fallido", CANCELLED: "Cancelado" } as const;
const sourceLabels = { SYSTEM: "Sistema", ADMIN: "Administrador", STRIPE: "Stripe" } as const;
const emailStatusLabels = { PENDING: "Pendiente", SENT: "Enviado", FAILED: "Fallido" } as const;

function formatDate(value: Date | null) {
  return value?.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }) ?? "—";
}

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const numericReference = /^\d+$/.test(id) ? Number(id) : null;
  if (!id || (numericReference === null && id.length > 30) || (numericReference !== null && (!Number.isSafeInteger(numericReference) || numericReference < 1))) notFound();
  const order = await getPrismaClient().order.findUnique({
    where: numericReference === null ? { id } : { number: numericReference },
    include: {
      drop: { select: { id: true, title: true } },
      address: true,
      shipment: true,
      payment: { include: { refunds: { orderBy: { createdAt: "desc" } } } },
      emailDeliveries: { orderBy: { createdAt: "asc" } },
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          customizations: { where: { orderItemComponentId: null }, orderBy: { sortOrder: "asc" } },
          components: { orderBy: { sortOrder: "asc" }, include: { customizations: { orderBy: { sortOrder: "asc" } } } },
        },
      },
      statusHistory: { orderBy: { createdAt: "asc" }, include: { changedByAdminUser: { select: { email: true } } } },
    },
  });
  if (!order) notFound();
  const expectedEmails = [
    { type: "ORDER_RECEIVED" as const, label: "Confirmación al comprador" },
    { type: "ADMIN_NEW_ORDER" as const, label: "Aviso interno de nuevo pedido" },
    ...((order.status === "SHIPPED" || order.status === "DELIVERED")
      ? [{ type: "ORDER_SHIPPED" as const, label: "Aviso de envío al comprador" }]
      : []),
    ...((order.status === "CANCELLED" || order.payment?.status !== "PAID")
      ? [{ type: "ORDER_CANCELLED_OR_REFUNDED" as const, label: "Aviso de cancelación o reembolso" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title={`Pedido #${order.number}`} description={`${order.firstName} ${order.lastName} · ${formatDate(order.createdAt)}`} />
        <div className="flex flex-wrap gap-2"><Link className="rounded border border-slate-300 bg-white px-4 py-2 font-semibold" href="/admin/pedidos">Volver a pedidos</Link><Link className="rounded border border-slate-300 bg-white px-4 py-2 font-semibold" href={`/pedido/${order.publicToken}`} target="_blank">Ver como comprador</Link></div>
      </div>
      <Flash searchParams={query} />
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3"><OrderStatusBadge status={order.status} />{order.payment ? <FinancialStatusBadge status={order.payment.status} /> : <span className="text-sm font-semibold text-red-700">Pago no registrado</span>}</div>
        <div className="mt-5 border-t border-slate-200 pt-5">
          <h2 className="text-xl font-bold">Siguiente acción</h2>
          {order.status === "RECEIVED" ? <form action={markOrderInProduction} className="mt-3"><input name="orderId" type="hidden" value={order.id} /><input name="orderNumber" type="hidden" value={order.number} /><button className="rounded bg-[var(--rr-gold-400)] px-4 py-3 font-bold text-[var(--rr-navy-950)]" type="submit">Marcar en fabricación</button></form> : null}
          {order.status === "IN_PRODUCTION" ? <form action={markOrderShipped} className="mt-3 grid gap-4 lg:grid-cols-2"><input name="orderId" type="hidden" value={order.id} /><input name="orderNumber" type="hidden" value={order.number} /><label className="text-sm font-semibold">Número de seguimiento <span className="font-normal text-slate-500">(opcional)</span><input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal" defaultValue={order.shipment?.trackingNumber ?? ""} maxLength={191} name="trackingNumber" /></label><label className="text-sm font-semibold">URL de seguimiento <span className="font-normal text-slate-500">(opcional)</span><input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal" defaultValue={order.shipment?.trackingUrl ?? ""} maxLength={2048} name="trackingUrl" placeholder="https://..." type="url" /></label><div className="lg:col-span-2"><button className="rounded bg-[var(--rr-gold-400)] px-4 py-3 font-bold text-[var(--rr-navy-950)]" type="submit">Marcar como enviado</button><p className="mt-2 text-sm text-slate-500">La expedición y la etiqueta se crean manualmente en SEUR Pro.</p></div></form> : null}
          {order.status === "SHIPPED" ? <form action={markOrderDelivered} className="mt-3"><input name="orderId" type="hidden" value={order.id} /><input name="orderNumber" type="hidden" value={order.number} /><ConfirmSubmitButton className="rounded bg-emerald-700 px-4 py-3 font-bold text-white" message="¿Confirmas que SEUR muestra este pedido como entregado?">Marcar como entregado</ConfirmSubmitButton><p className="mt-2 text-sm text-slate-500">Comprueba antes la entrega en SEUR Pro.</p></form> : null}
          {order.status === "DELIVERED" ? <p className="mt-3 text-sm text-slate-600">El pedido ha completado su recorrido operativo.</p> : null}
          {order.status === "CANCELLED" ? <p className="mt-3 text-sm text-slate-600">El pedido está cancelado y no admite más cambios operativos.</p> : null}
          {(order.status === "RECEIVED" || order.status === "IN_PRODUCTION") ? <div className="mt-5 border-t border-red-300 pt-4"><form action={cancelOrder}><input name="orderId" type="hidden" value={order.id} /><input name="orderNumber" type="hidden" value={order.number} /><ConfirmSubmitButton className="rounded border border-red-300 px-4 py-2 font-semibold text-red-700" message="¿Seguro que quieres cancelar este pedido? Esta acción no realiza el reembolso.">Cancelar pedido</ConfirmSubmitButton></form><p className="mt-2 text-xs text-slate-500">Cancelar cambia el estado operativo, pero no devuelve el dinero. Los reembolsos se realizan desde Stripe Dashboard.</p></div> : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.75fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Productos</h2><div className="mt-3 divide-y divide-slate-200">{order.items.map((item) => <article className="py-4" key={item.id}><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{item.quantity} × {item.productNameSnapshot}</h3>{item.sizeLabelSnapshot ? <p className="text-sm text-slate-500">Talla {item.sizeLabelSnapshot}</p> : null}{item.customizations.map((customization) => <p className="text-sm text-slate-500" key={customization.id}>{customization.labelSnapshot}: {customization.valueSnapshot}</p>)}</div><strong>{formatMoney(item.lineTotalCents)}</strong></div>{item.components.length > 0 ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{item.components.map((component) => <div className="rounded border border-slate-200 p-3 text-sm" key={component.id}><p className="font-bold">{component.componentLabelSnapshot}</p><p>{component.quantitySnapshot} × {component.productNameSnapshot}</p><p className="text-slate-500">Talla {component.sizeLabelSnapshot}</p>{component.customizations.map((customization) => <p className="text-slate-500" key={customization.id}>{customization.labelSnapshot}: {customization.valueSnapshot}</p>)}</div>)}</div> : null}</article>)}</div></section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Entrega</h2>{order.address ? <address className="mt-3 not-italic text-sm leading-6"><strong>{order.firstName} {order.lastName}</strong><br />{order.address.street}, {order.address.streetNumber}{order.address.additionalLine ? <><br />{order.address.additionalLine}</> : null}<br />{order.address.postalCode} {order.address.city}, {order.address.province}<br />España<br /><a className="font-semibold underline" href={`tel:${order.phone}`}>{order.phone}</a></address> : <p className="mt-3 text-slate-500">No hay una dirección asociada.</p>}{order.shipment ? <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Transportista</dt><dd className="font-semibold">SEUR · gestión manual</dd></div><div><dt className="text-slate-500">Fecha de envío</dt><dd className="font-semibold">{formatDate(order.shipment.shippedAt)}</dd></div><div><dt className="text-slate-500">Seguimiento</dt><dd className="font-semibold">{order.shipment.trackingNumber ?? "Sin número"}</dd></div><div><dt className="text-slate-500">Enlace</dt><dd>{order.shipment.trackingUrl ? <a className="font-semibold underline" href={order.shipment.trackingUrl} rel="noreferrer" target="_blank">Abrir seguimiento</a> : "Sin enlace"}</dd></div></dl> : null}<p className="mt-4 text-sm text-slate-500">Si la entrega falla, el comprador debe contactar por email y la incidencia se gestiona en SEUR Pro.</p></section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Notas</h2><div className="mt-4 rounded border border-slate-200 p-4"><h3 className="font-semibold">Observaciones del comprador</h3><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{order.notes ?? "Sin observaciones."}</p></div><form action={saveInternalNotes} className="mt-4"><input name="orderId" type="hidden" value={order.id} /><input name="orderNumber" type="hidden" value={order.number} /><label className="font-semibold">Notas internas<textarea className="mt-2 min-h-32 w-full rounded border border-slate-300 p-3 font-normal" defaultValue={order.internalNotes ?? ""} maxLength={20_000} name="internalNotes" placeholder="Solo visibles para administración" /></label><button className="mt-3 rounded bg-[var(--rr-navy-900)] px-4 py-2 font-semibold text-white" type="submit">Guardar notas</button></form></section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Resumen</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Subtotal</dt><dd>{formatMoney(order.subtotalCents)}</dd></div>{order.discountCents > 0 ? <div className="flex justify-between gap-4 text-emerald-700"><dt>Descuento{order.couponCodeSnapshot ? ` · ${order.couponCodeSnapshot}` : ""}</dt><dd>−{formatMoney(order.discountCents)}</dd></div> : null}<div className="flex justify-between gap-4"><dt className="text-slate-500">Envío</dt><dd>{formatMoney(order.shippingCents)}</dd></div><div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-bold"><dt>Total</dt><dd>{formatMoney(order.totalCents)}</dd></div></dl><p className="mt-4 text-sm text-slate-500">Drop: <Link className="font-semibold underline" href={`/admin/drops/${order.drop.id}`}>{order.drop.title}</Link></p></section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Pago y reembolsos</h2>{order.payment ? <><div className="mt-3 flex items-center justify-between gap-3"><FinancialStatusBadge status={order.payment.status} /><strong>{formatMoney(order.payment.amountCents)}</strong></div><p className="mt-2 text-sm text-slate-500">Pagado: {formatDate(order.payment.paidAt)}</p>{order.payment.refunds.length > 0 ? <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4">{order.payment.refunds.map((refund) => <li className="flex justify-between gap-3 text-sm" key={refund.id}><span>{refundLabels[refund.status]}{refund.reason ? <span className="block text-xs text-slate-500">{refund.reason}</span> : null}</span><strong>{formatMoney(refund.amountCents)}</strong></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Sin reembolsos.</p>}<p className="mt-4 text-xs text-slate-500">Los reembolsos se inician en Stripe Dashboard. La tienda actualizará automáticamente su estado.</p></> : <p className="mt-3 text-sm text-red-700">No se ha encontrado el pago asociado.</p>}</section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Correos</h2>
            <p className="mt-1 text-sm text-slate-500">Los fallos de correo no cambian el estado del pedido.</p>
            <ul className="mt-4 space-y-4">
              {expectedEmails.map((email) => {
                const delivery = order.emailDeliveries.find((item) => item.type === email.type);
                const failed = delivery?.status === "FAILED";
                return (
                  <li className="rounded border border-slate-200 p-3 text-sm" key={email.type}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{email.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{delivery?.recipient ?? "Aún no registrado"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${delivery?.status === "SENT" ? "bg-emerald-100 text-emerald-800" : failed ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                        {delivery ? emailStatusLabels[delivery.status] : "No enviado"}
                      </span>
                    </div>
                    {delivery ? <p className="mt-2 text-xs text-slate-500">{delivery.attemptCount} intento{delivery.attemptCount === 1 ? "" : "s"} · {formatDate(delivery.sentAt ?? delivery.lastAttemptAt)}</p> : null}
                    {delivery?.lastErrorSummary ? <p className="mt-2 text-xs font-medium text-red-700">{delivery.lastErrorSummary}</p> : null}
                    <form action={resendOrderEmail} className="mt-3">
                      <input name="orderId" type="hidden" value={order.id} />
                      <input name="orderNumber" type="hidden" value={order.number} />
                      <input name="type" type="hidden" value={email.type} />
                      <button className="rounded border border-slate-300 bg-white px-3 py-2 font-semibold hover:border-slate-500 hover:bg-slate-100" type="submit">
                        {failed ? "Reintentar" : delivery?.status === "SENT" ? "Reenviar" : "Enviar"}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">Historial</h2><ol className="mt-4 space-y-4">{order.statusHistory.map((entry) => <li className="border-l-2 border-slate-300 pl-4 text-sm" key={entry.id}><p className="font-semibold">{entry.fromStatus ? `${orderStatusLabels[entry.fromStatus]} → ` : ""}{orderStatusLabels[entry.toStatus]}</p><p className="text-slate-500">{formatDate(entry.createdAt)} · {sourceLabels[entry.source]}{entry.changedByAdminUser ? ` · ${entry.changedByAdminUser.email}` : ""}</p></li>)}</ol></section>
        </aside>
      </div>
    </div>
  );
}
