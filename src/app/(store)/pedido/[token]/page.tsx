import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClearCartAfterOrder, ConfirmationPending } from "@/features/checkout/confirmation-client";
import { formatMoney } from "@/features/catalog/domain";
import { getPublicStoreSettings } from "@/features/settings/server/store-settings";
import { getPrismaClient } from "@/server/db/client";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusCopy = {
  RECEIVED: { eyebrow: "Pedido recibido", title: "Hemos confirmado tu pedido", text: "Lo prepararemos para fabricación cuando cierre el drop." },
  IN_PRODUCTION: { eyebrow: "En fabricación", title: "Tu pedido está en marcha", text: "Las prendas se están preparando con los datos que nos indicaste." },
  SHIPPED: { eyebrow: "Pedido enviado", title: "Tu pedido va de camino", text: "Consulta debajo la información de seguimiento disponible." },
  DELIVERED: { eyebrow: "Pedido entregado", title: "¡Ya lo tienes!", text: "El pedido figura como entregado." },
  CANCELLED: { eyebrow: "Pedido cancelado", title: "Este pedido está cancelado", text: "Si necesitas aclarar el estado del pago, contacta con nosotros." },
} as const;

const timeline = [
  ["RECEIVED", "Pedido recibido"],
  ["IN_PRODUCTION", "En fabricación"],
  ["SHIPPED", "Enviado"],
  ["DELIVERED", "Entregado"],
] as const;

const statusPosition = { RECEIVED: 0, IN_PRODUCTION: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: -1 } as const;

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token.length < 32 || token.length > 128) notFound();
  const prisma = getPrismaClient();
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { publicToken: token },
      include: {
        items: {
          include: {
            components: { orderBy: { sortOrder: "asc" }, include: { customizations: { orderBy: { sortOrder: "asc" } } } },
            customizations: { where: { orderItemComponentId: null }, orderBy: { sortOrder: "asc" } },
          },
        },
        address: true,
        shipment: true,
      },
    }),
    getPublicStoreSettings(),
  ]);
  const supportEmail = settings?.supportEmail ?? "risingraimon@gmail.com";
  if (!order) {
    const attempt = await prisma.checkoutAttempt.findUnique({ where: { publicToken: token }, select: { status: true } });
    if (!attempt) notFound();
    if (["FAILED", "EXPIRED", "CANCELLED"].includes(attempt.status)) {
      return <main className="mx-auto min-h-[62vh] max-w-3xl px-5 py-16"><div className="brand-panel p-8 text-center"><h1 className="font-display text-6xl text-white">No hemos podido confirmar el pedido</h1><p className="mt-5 text-white/68">Si no se ha realizado ningún cargo, vuelve al carrito para intentarlo de nuevo. Si necesitas ayuda, escríbenos.</p></div></main>;
    }
    return <main className="mx-auto min-h-[62vh] max-w-3xl px-5 py-16"><ConfirmationPending /></main>;
  }
  const copy = statusCopy[order.status];
  const currentPosition = statusPosition[order.status];

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
      <ClearCartAfterOrder />
      <p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">{copy.eyebrow}</p>
      <h1 className="mt-2 font-display text-7xl text-white">Pedido #{order.number}</h1>
      <h2 className="mt-4 text-xl font-bold text-white">{copy.title}</h2>
      <p className="mt-2 text-white/68">{copy.text}</p>

      {order.status !== "CANCELLED" ? <ol className="mt-8 grid gap-2 sm:grid-cols-4" aria-label="Progreso del pedido">{timeline.map(([status, label], index) => <li className={`border px-4 py-3 text-sm font-semibold ${index <= currentPosition ? "border-brand-gold/70 bg-brand-gold/10 text-white" : "border-white/12 text-white/45"}`} key={status}><span className="block text-xs text-brand-gold">{index + 1}</span>{label}</li>)}</ol> : <div className="mt-8 border border-red-400/50 bg-red-950/35 p-4 text-red-100">Si se ha tramitado un reembolso, puede tardar unos días en aparecer según el método de pago.</div>}

      {order.status === "SHIPPED" || order.status === "DELIVERED" ? <section className="mt-7 border border-brand-gold/40 bg-brand-gold/10 p-5"><h2 className="font-heading text-2xl font-bold uppercase text-white">Seguimiento</h2>{order.shipment?.trackingNumber ? <p className="mt-2 text-white/75">Número: <strong className="text-white">{order.shipment.trackingNumber}</strong></p> : <p className="mt-2 text-white/75">El envío no tiene número de seguimiento asociado.</p>}{order.shipment?.trackingUrl ? <a className="mt-4 inline-flex bg-brand-gold px-4 py-2 font-bold text-brand-navy" href={order.shipment.trackingUrl} rel="noreferrer" target="_blank">Ver seguimiento</a> : null}<p className="mt-4 text-sm text-white/60">Si la entrega no ha podido completarse, escríbenos y la gestionaremos con SEUR.</p></section> : null}

      <div className="mt-9 grid gap-7 md:grid-cols-[1fr_19rem]">
        <section className="border border-white/12 bg-white/[0.025] p-6"><h2 className="font-heading text-2xl font-bold uppercase text-white">Productos</h2><div className="mt-4 divide-y divide-white/10">{order.items.map((item) => <article className="py-4" key={item.id}><div className="flex justify-between gap-4"><div><h3 className="font-bold text-white">{item.quantity} × {item.productNameSnapshot}</h3>{item.sizeLabelSnapshot ? <p className="text-sm text-white/60">Talla {item.sizeLabelSnapshot}</p> : null}{item.customizations.map((custom) => <p className="text-sm text-white/60" key={custom.id}>{custom.labelSnapshot}: {custom.valueSnapshot}</p>)}</div><strong className="text-white">{formatMoney(item.lineTotalCents)}</strong></div>{item.components.map((component) => <div className="mt-3 border-l border-brand-gold/50 pl-3 text-sm text-white/60" key={component.id}><strong className="text-white/80">{component.componentLabelSnapshot}: {component.quantitySnapshot} × {component.productNameSnapshot}</strong> · Talla {component.sizeLabelSnapshot}{component.customizations.map((custom) => <p key={custom.id}>{custom.labelSnapshot}: {custom.valueSnapshot}</p>)}</div>)}</article>)}</div></section>
        <aside className="h-fit border border-white/12 bg-[#0b1b31] p-6"><h2 className="font-heading text-2xl font-bold uppercase text-white">Resumen</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between text-white/65"><dt>Subtotal</dt><dd>{formatMoney(order.subtotalCents)}</dd></div>{order.discountCents ? <div className="flex justify-between text-emerald-200"><dt>Descuento</dt><dd>−{formatMoney(order.discountCents)}</dd></div> : null}<div className="flex justify-between text-white/65"><dt>Envío</dt><dd>{formatMoney(order.shippingCents)}</dd></div><div className="flex justify-between border-t border-white/12 pt-4 text-xl font-bold text-white"><dt>Total</dt><dd>{formatMoney(order.totalCents)}</dd></div></dl>{order.address ? <div className="mt-6 border-t border-white/12 pt-5 text-sm text-white/60"><p className="font-bold text-white">Entrega a domicilio</p><p>{order.address.postalCode} · {order.address.city}</p></div> : null}</aside>
      </div>
      <p className="mt-9 text-sm text-white/60">¿Necesitas ayuda con tu pedido? <a className="text-brand-gold underline" href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
    </main>
  );
}
