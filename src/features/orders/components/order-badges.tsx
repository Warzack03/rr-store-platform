import {
  financialStatusLabels,
  orderStatusLabels,
  type FinancialStatus,
  type OrderStatus,
} from "@/features/orders/domain";

const orderClasses: Record<OrderStatus, string> = {
  RECEIVED: "border-sky-400/50 bg-sky-500/15 text-sky-700",
  IN_PRODUCTION: "border-amber-400/50 bg-amber-500/15 text-amber-700",
  SHIPPED: "border-violet-400/50 bg-violet-500/15 text-violet-700",
  DELIVERED: "border-emerald-400/50 bg-emerald-500/15 text-emerald-700",
  CANCELLED: "border-red-400/50 bg-red-500/15 text-red-700",
};

const financialClasses: Record<FinancialStatus, string> = {
  PAID: "border-emerald-400/50 bg-emerald-500/15 text-emerald-700",
  PARTIALLY_REFUNDED: "border-amber-400/50 bg-amber-500/15 text-amber-700",
  REFUNDED: "border-slate-400/50 bg-slate-500/15 text-slate-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${orderClasses[status]}`}>{orderStatusLabels[status]}</span>;
}

export function FinancialStatusBadge({ status }: { status: FinancialStatus }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${financialClasses[status]}`}>{financialStatusLabels[status]}</span>;
}
