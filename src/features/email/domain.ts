import { formatMoney } from "@/features/catalog/domain";

export type OrderEmailType =
  | "ORDER_RECEIVED"
  | "ORDER_SHIPPED"
  | "ORDER_CANCELLED_OR_REFUNDED"
  | "ADMIN_NEW_ORDER";

type Customization = { labelSnapshot: string; valueSnapshot: string };

export type EmailOrder = {
  number: number;
  publicToken: string;
  status: "RECEIVED" | "IN_PRODUCTION" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  items: Array<{
    productNameSnapshot: string;
    sizeLabelSnapshot: string | null;
    quantity: number;
    lineTotalCents: number;
    customizations: Customization[];
    components: Array<{
      componentLabelSnapshot: string;
      productNameSnapshot: string;
      sizeLabelSnapshot: string;
      quantitySnapshot: number;
      customizations: Customization[];
    }>;
  }>;
  address: {
    postalCode: string;
    province: string;
    city: string;
    street: string;
    streetNumber: string;
    additionalLine: string | null;
  } | null;
  shipment: { trackingNumber: string | null; trackingUrl: string | null } | null;
  payment: { status: "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED" } | null;
};

export type EmailStoreSettings = {
  storeName: string;
  supportEmail: string;
  deliveryEstimateText: string;
};

export type RenderedEmail = { subject: string; text: string; html: string };

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHttpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function itemText(order: EmailOrder) {
  return order.items.flatMap((item) => {
    const details = [
      `${item.quantity} × ${item.productNameSnapshot} — ${formatMoney(item.lineTotalCents)}`,
      ...(item.sizeLabelSnapshot ? [`  Talla: ${item.sizeLabelSnapshot}`] : []),
      ...item.customizations.map((customization) => `  ${customization.labelSnapshot}: ${customization.valueSnapshot}`),
      ...item.components.flatMap((component) => [
        `  ${component.componentLabelSnapshot}: ${component.quantitySnapshot} × ${component.productNameSnapshot} · Talla ${component.sizeLabelSnapshot}`,
        ...component.customizations.map((customization) => `    ${customization.labelSnapshot}: ${customization.valueSnapshot}`),
      ]),
    ];
    return details;
  }).join("\n");
}

function itemHtml(order: EmailOrder) {
  return order.items.map((item) => `<div style="padding:14px 0;border-bottom:1px solid #d9e1ea">
    <strong>${escapeHtml(item.quantity)} × ${escapeHtml(item.productNameSnapshot)}</strong>
    <span style="float:right;font-weight:700">${escapeHtml(formatMoney(item.lineTotalCents))}</span>
    ${item.sizeLabelSnapshot ? `<div style="color:#526174">Talla ${escapeHtml(item.sizeLabelSnapshot)}</div>` : ""}
    ${item.customizations.map((customization) => `<div style="color:#526174">${escapeHtml(customization.labelSnapshot)}: ${escapeHtml(customization.valueSnapshot)}</div>`).join("")}
    ${item.components.map((component) => `<div style="margin-top:8px;padding-left:10px;border-left:2px solid #d9a928;color:#526174"><strong>${escapeHtml(component.componentLabelSnapshot)}</strong>: ${escapeHtml(component.quantitySnapshot)} × ${escapeHtml(component.productNameSnapshot)} · Talla ${escapeHtml(component.sizeLabelSnapshot)}${component.customizations.map((customization) => `<div>${escapeHtml(customization.labelSnapshot)}: ${escapeHtml(customization.valueSnapshot)}</div>`).join("")}</div>`).join("")}
  </div>`).join("");
}

function totalsText(order: EmailOrder) {
  return [
    `Subtotal: ${formatMoney(order.subtotalCents)}`,
    ...(order.discountCents > 0 ? [`Descuento: −${formatMoney(order.discountCents)}`] : []),
    `Envío: ${formatMoney(order.shippingCents)}`,
    `Total: ${formatMoney(order.totalCents)}`,
  ].join("\n");
}

function totalsHtml(order: EmailOrder) {
  return `<div style="margin-top:18px;padding:16px;background:#f2f5f8">
    <div>Subtotal <strong style="float:right">${escapeHtml(formatMoney(order.subtotalCents))}</strong></div>
    ${order.discountCents > 0 ? `<div style="color:#137a52">Descuento <strong style="float:right">−${escapeHtml(formatMoney(order.discountCents))}</strong></div>` : ""}
    <div>Envío <strong style="float:right">${escapeHtml(formatMoney(order.shippingCents))}</strong></div>
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #cbd5df;font-size:18px">Total <strong style="float:right">${escapeHtml(formatMoney(order.totalCents))}</strong></div>
  </div>`;
}

function emailShell(storeName: string, content: string, supportEmail: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#07101d;font-family:Arial,sans-serif;color:#10233e"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="padding:18px 22px;background:#0b1b31;color:#ffd46f;font-size:22px;font-weight:800">${escapeHtml(storeName)}</div><div style="padding:24px 22px;background:#fff">${content}<p style="margin-top:26px;color:#526174;font-size:13px">¿Necesitas ayuda? Responde a este correo o escríbenos a <a href="mailto:${escapeHtml(supportEmail)}" style="color:#9a6f00">${escapeHtml(supportEmail)}</a>.</p></div></div></body></html>`;
}

function hideCustomerOrderNumber(rendered: RenderedEmail, orderNumber: number): RenderedEmail {
  const marker = `#${orderNumber}`;
  return {
    subject: rendered.subject.replaceAll(marker, ""),
    text: rendered.text.replaceAll(marker, ""),
    html: rendered.html.replaceAll(marker, ""),
  };
}

export function renderOrderEmail(
  type: OrderEmailType,
  order: EmailOrder,
  settings: EmailStoreSettings,
  siteUrl: string,
): RenderedEmail {
  const privateUrl = `${siteUrl.replace(/\/$/, "")}/pedido/${encodeURIComponent(order.publicToken)}`;
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/admin/pedidos/${order.number}`;
  const greeting = `Hola, ${order.firstName}:`;
  if (type === "ADMIN_NEW_ORDER") {
    const subject = `Nuevo pedido #${order.number} · ${formatMoney(order.totalCents)}`;
    const text = `Nuevo pedido pagado\n\nPedido #${order.number}\nCliente: ${order.firstName} ${order.lastName}\nEmail: ${order.email}\nTeléfono: ${order.phone}\n\n${itemText(order)}\n\n${totalsText(order)}\n\nGestionar pedido: ${adminUrl}`;
    const content = `<h1 style="margin-top:0">Nuevo pedido #${escapeHtml(order.number)}</h1><p><strong>${escapeHtml(order.firstName)} ${escapeHtml(order.lastName)}</strong><br>${escapeHtml(order.email)}<br>${escapeHtml(order.phone)}</p>${itemHtml(order)}${totalsHtml(order)}<p><a href="${escapeHtml(adminUrl)}" style="display:inline-block;margin-top:18px;padding:12px 18px;background:#ffd46f;color:#07101d;font-weight:700;text-decoration:none">Gestionar pedido</a></p>`;
    return { subject, text, html: emailShell(settings.storeName, content, settings.supportEmail) };
  }
  if (type === "ORDER_SHIPPED") {
    const trackingUrl = safeHttpUrl(order.shipment?.trackingUrl ?? null);
    const trackingText = order.shipment?.trackingNumber ? `\nNúmero de seguimiento: ${order.shipment.trackingNumber}` : "";
    const subject = `Tu pedido #${order.number} ha sido enviado`;
    const text = `${greeting}\n\nTu pedido ya va de camino.${trackingText}${trackingUrl ? `\nSeguimiento: ${trackingUrl}` : ""}\n\nConsulta tu pedido: ${privateUrl}\n\nSi la entrega no ha podido completarse, contacta con ${settings.supportEmail}.`;
    const content = `<h1 style="margin-top:0">Tu pedido va de camino</h1><p>${escapeHtml(greeting)}</p><p>Hemos marcado el pedido <strong>#${escapeHtml(order.number)}</strong> como enviado.</p>${order.shipment?.trackingNumber ? `<p>Número de seguimiento: <strong>${escapeHtml(order.shipment.trackingNumber)}</strong></p>` : ""}${trackingUrl ? `<p><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;padding:12px 18px;background:#ffd46f;color:#07101d;font-weight:700;text-decoration:none">Ver seguimiento</a></p>` : ""}<p><a href="${escapeHtml(privateUrl)}">Consultar mi pedido</a></p><p style="color:#526174">Si la entrega no ha podido completarse, escríbenos y la gestionaremos con SEUR.</p>`;
    return hideCustomerOrderNumber({ subject, text, html: emailShell(settings.storeName, content, settings.supportEmail) }, order.number);
  }
  if (type === "ORDER_CANCELLED_OR_REFUNDED") {
    const hasRefund = order.payment?.status === "REFUNDED" || order.payment?.status === "PARTIALLY_REFUNDED";
    const subject = hasRefund ? `Actualización del pago del pedido #${order.number}` : `Pedido #${order.number} cancelado`;
    const detail = order.payment?.status === "REFUNDED" ? "El pago figura como reembolsado." : order.payment?.status === "PARTIALLY_REFUNDED" ? "Se ha registrado un reembolso parcial." : "El pedido figura como cancelado.";
    const text = `${greeting}\n\n${detail}\n\nConsulta tu pedido: ${privateUrl}\n\nSi tienes cualquier duda, contacta con ${settings.supportEmail}.`;
    const content = `<h1 style="margin-top:0">Actualización de tu pedido</h1><p>${escapeHtml(greeting)}</p><p>${escapeHtml(detail)}</p><p>Los reembolsos pueden tardar unos días en aparecer según el método de pago.</p><p><a href="${escapeHtml(privateUrl)}">Consultar mi pedido</a></p>`;
    return hideCustomerOrderNumber({ subject, text, html: emailShell(settings.storeName, content, settings.supportEmail) }, order.number);
  }
  const address = order.address ? `${order.address.street}, ${order.address.streetNumber}${order.address.additionalLine ? `, ${order.address.additionalLine}` : ""}\n${order.address.postalCode} ${order.address.city}, ${order.address.province}` : "";
  const subject = `Pedido #${order.number} recibido`;
  const text = `${greeting}\n\nHemos recibido tu pedido y confirmado el pago.\n\n${itemText(order)}\n\n${totalsText(order)}${address ? `\n\nEntrega a domicilio:\n${address}` : ""}\n\n${settings.deliveryEstimateText}\n\nConsulta tu pedido: ${privateUrl}`;
  const addressHtml = order.address ? `<div style="margin-top:18px"><strong>Entrega a domicilio</strong><br>${escapeHtml(order.address.street)}, ${escapeHtml(order.address.streetNumber)}${order.address.additionalLine ? `<br>${escapeHtml(order.address.additionalLine)}` : ""}<br>${escapeHtml(order.address.postalCode)} ${escapeHtml(order.address.city)}, ${escapeHtml(order.address.province)}</div>` : "";
  const content = `<h1 style="margin-top:0">Pedido #${escapeHtml(order.number)} recibido</h1><p>${escapeHtml(greeting)}</p><p>Hemos recibido tu pedido y confirmado el pago.</p>${itemHtml(order)}${totalsHtml(order)}${addressHtml}<p>${escapeHtml(settings.deliveryEstimateText)}</p><p><a href="${escapeHtml(privateUrl)}" style="display:inline-block;padding:12px 18px;background:#ffd46f;color:#07101d;font-weight:700;text-decoration:none">Consultar mi pedido</a></p>`;
  return hideCustomerOrderNumber({ subject, text, html: emailShell(settings.storeName, content, settings.supportEmail) }, order.number);
}
