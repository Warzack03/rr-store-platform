export const orderStatuses = [
  "RECEIVED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type FinancialStatus = "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED";
export type StoredRefundStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export const orderStatusLabels: Record<OrderStatus, string> = {
  RECEIVED: "Recibido",
  IN_PRODUCTION: "En fabricación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const financialStatusLabels: Record<FinancialStatus, string> = {
  PAID: "Pagado",
  PARTIALLY_REFUNDED: "Reembolso parcial",
  REFUNDED: "Reembolsado",
};

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  RECEIVED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  return transitions[from].includes(to);
}

export function refundStatusFromStripe(status: string | null): StoredRefundStatus {
  if (status === "succeeded") return "SUCCEEDED";
  if (status === "failed") return "FAILED";
  if (status === "canceled") return "CANCELLED";
  return "PENDING";
}

export function paymentStatusAfterRefunds(
  paidAmountCents: number,
  refunds: ReadonlyArray<{ amountCents: number; status: StoredRefundStatus }>,
): FinancialStatus {
  const refundedCents = refunds
    .filter((refund) => refund.status === "SUCCEEDED")
    .reduce((total, refund) => total + refund.amountCents, 0);
  if (refundedCents <= 0) return "PAID";
  return refundedCents >= paidAmountCents ? "REFUNDED" : "PARTIALLY_REFUNDED";
}

type CustomizationSnapshot = {
  type: "NAME" | "NUMBER";
  valueSnapshot: string;
};

export type ManufacturingOrder = {
  number: number;
  items: Array<{
    productNameSnapshot: string;
    sizeLabelSnapshot: string | null;
    quantity: number;
    customizations: CustomizationSnapshot[];
    components: Array<{
      componentLabelSnapshot: string;
      productNameSnapshot: string;
      sizeLabelSnapshot: string;
      quantitySnapshot: number;
      customizations: CustomizationSnapshot[];
    }>;
  }>;
};

export type ManufacturingRow = {
  reference: string;
  orderedProduct: string;
  component: string;
  manufacturingProduct: string;
  quantity: number;
  size: string;
  name: string;
  number: string;
};

function customizationValue(customizations: CustomizationSnapshot[], type: "NAME" | "NUMBER") {
  return customizations.find((customization) => customization.type === type)?.valueSnapshot ?? "";
}

export function buildManufacturingRows(orders: ManufacturingOrder[]): ManufacturingRow[] {
  return orders.flatMap((order) => order.items.flatMap((item) => {
    if (item.components.length > 0) {
      return item.components.map((component) => ({
        reference: `#${order.number}`,
        orderedProduct: item.productNameSnapshot,
        component: component.componentLabelSnapshot,
        manufacturingProduct: component.productNameSnapshot,
        quantity: item.quantity * component.quantitySnapshot,
        size: component.sizeLabelSnapshot,
        name: customizationValue(component.customizations, "NAME"),
        number: customizationValue(component.customizations, "NUMBER"),
      }));
    }
    return [{
      reference: `#${order.number}`,
      orderedProduct: item.productNameSnapshot,
      component: "",
      manufacturingProduct: item.productNameSnapshot,
      quantity: item.quantity,
      size: item.sizeLabelSnapshot ?? "",
      name: customizationValue(item.customizations, "NAME"),
      number: customizationValue(item.customizations, "NUMBER"),
    }];
  }));
}

function safeSpreadsheetCell(value: string | number) {
  const text = String(value);
  const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replaceAll('"', '""')}"`;
}

export function buildManufacturingCsv(orders: ManufacturingOrder[]) {
  const header = [
    "Referencia",
    "Producto pedido",
    "Componente",
    "Producto de fabricación",
    "Cantidad",
    "Talla",
    "Nombre",
    "Dorsal",
  ];
  const rows = buildManufacturingRows(orders).map((row) => [
    row.reference,
    row.orderedProduct,
    row.component,
    row.manufacturingProduct,
    row.quantity,
    row.size,
    row.name,
    row.number,
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(safeSpreadsheetCell).join(";")).join("\r\n")}\r\n`;
}
