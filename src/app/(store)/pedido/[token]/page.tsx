import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClearCartAfterOrder, ConfirmationPending } from "@/features/checkout/confirmation-client";
import { formatMoney } from "@/features/catalog/domain";
import { getPrismaClient } from "@/server/db/client";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token.length < 32 || token.length > 128) notFound();
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      items: { include: { components: { orderBy: { sortOrder: "asc" }, include: { customizations: { orderBy: { sortOrder: "asc" } } } }, customizations: { where: { orderItemComponentId: null }, orderBy: { sortOrder: "asc" } } } },
      address: true,
      shipment: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) {
    const attempt = await prisma.checkoutAttempt.findUnique({ where: { publicToken: token }, select: { status: true } });
    if (!attempt) notFound();
    if (["FAILED", "EXPIRED", "CANCELLED"].includes(attempt.status)) return <main className="mx-auto min-h-[62vh] max-w-3xl px-5 py-16"><div className="brand-panel p-8 text-center"><h1 className="font-display text-6xl text-white">No hemos podido confirmar el pedido</h1><p className="mt-5 text-white/68">Si no se ha realizado ningún cargo, vuelve al carrito para intentarlo de nuevo. Si necesitas ayuda, escríbenos.</p></div></main>;
    return <main className="mx-auto min-h-[62vh] max-w-3xl px-5 py-16"><ConfirmationPending /></main>;
  }
  return <main className="mx-auto max-w-4xl px-5 py-12 md:px-8 md:py-16"><ClearCartAfterOrder /><p className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">¡Pedido recibido!</p><h1 className="mt-2 font-display text-7xl text-white">Pedido #{order.number}</h1><p className="mt-4 text-white/68">Hemos confirmado el pago. La referencia privada de este pedido está en esta misma página.</p><div className="mt-9 grid gap-7 md:grid-cols-[1fr_19rem]"><section className="border border-white/12 bg-white/[0.025] p-6"><h2 className="font-heading text-2xl font-bold uppercase text-white">Productos</h2><div className="mt-4 divide-y divide-white/10">{order.items.map((item) => <article className="py-4" key={item.id}><div className="flex justify-between gap-4"><div><h3 className="font-bold text-white">{item.quantity} × {item.productNameSnapshot}</h3>{item.sizeLabelSnapshot ? <p className="text-sm text-white/60">Talla {item.sizeLabelSnapshot}</p> : null}{item.customizations.map((custom) => <p className="text-sm text-white/60" key={custom.id}>{custom.labelSnapshot}: {custom.valueSnapshot}</p>)}</div><strong className="text-white">{formatMoney(item.lineTotalCents)}</strong></div>{item.components.map((component) => <div className="mt-3 border-l border-brand-gold/50 pl-3 text-sm text-white/60" key={component.id}><strong className="text-white/80">{component.componentLabelSnapshot}: {component.productNameSnapshot}</strong> · Talla {component.sizeLabelSnapshot}{component.customizations.map((custom) => <p key={custom.id}>{custom.labelSnapshot}: {custom.valueSnapshot}</p>)}</div>)}</article>)}</div></section><aside className="h-fit border border-white/12 bg-[#0b1b31] p-6"><h2 className="font-heading text-2xl font-bold uppercase text-white">Resumen</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between text-white/65"><dt>Subtotal</dt><dd>{formatMoney(order.subtotalCents)}</dd></div>{order.discountCents ? <div className="flex justify-between text-emerald-200"><dt>Descuento</dt><dd>−{formatMoney(order.discountCents)}</dd></div> : null}<div className="flex justify-between text-white/65"><dt>Envío</dt><dd>{formatMoney(order.shippingCents)}</dd></div><div className="flex justify-between border-t border-white/12 pt-4 text-xl font-bold text-white"><dt>Total</dt><dd>{formatMoney(order.totalCents)}</dd></div></dl>{order.address ? <div className="mt-6 border-t border-white/12 pt-5 text-sm text-white/60"><p className="font-bold text-white">Entrega a domicilio</p><p>{order.address.postalCode} · {order.address.city}</p></div> : null}</aside></div><p className="mt-9 text-sm text-white/60">¿Necesitas ayuda con tu pedido? <a className="text-brand-gold underline" href="mailto:risingraimon@gmail.com">risingraimon@gmail.com</a></p></main>;
}
