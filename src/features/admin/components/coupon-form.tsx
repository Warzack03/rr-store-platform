import { archiveCoupon, saveCoupon } from "@/features/admin/server/coupon-actions";

import { Flash } from "./flash";

type CouponValue = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  dropId: string | null;
  minOrderCents: number | null;
  maxRedemptions: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  archivedAt: Date | null;
};

function localDate(value: Date | null | undefined) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.valueOf() - offset).toISOString().slice(0, 16);
}

function euros(value: number | null | undefined) {
  return value == null ? "" : (value / 100).toFixed(2);
}

export function CouponForm({
  coupon,
  drops,
  searchParams,
}: {
  coupon?: CouponValue;
  drops: Array<{ id: string; title: string }>;
  searchParams?: { ok?: string; error?: string };
}) {
  const field = "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2";
  return (
    <div className="space-y-5">
      <Flash searchParams={searchParams} />
      <form action={saveCoupon} className="space-y-6">
        {coupon ? <input name="id" type="hidden" value={coupon.id} /> : null}
        <section className="grid gap-4 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold">Reglas del cupón</h2>
            <p className="text-sm text-slate-500">El importe fijo y el pedido mínimo se introducen en euros.</p>
          </div>
          <label className="text-sm font-semibold">Código<input autoCapitalize="characters" className={`${field} uppercase`} defaultValue={coupon?.code} maxLength={100} name="code" pattern="[A-Za-z0-9_-]+" required /></label>
          <label className="text-sm font-semibold">Tipo<select className={field} defaultValue={coupon?.type ?? "PERCENT"} name="type"><option value="PERCENT">Porcentaje</option><option value="FIXED">Importe fijo</option></select></label>
          <label className="text-sm font-semibold">Valor (% o €)<input className={field} defaultValue={coupon ? (coupon.type === "FIXED" ? euros(coupon.value) : coupon.value) : ""} min="0.01" name="value" required step="0.01" type="number" /></label>
          <label className="text-sm font-semibold">Aplicación<select className={field} defaultValue={coupon?.dropId ?? ""} name="dropId"><option value="">Todos los drops</option>{drops.map((drop) => <option key={drop.id} value={drop.id}>{drop.title}</option>)}</select></label>
          <label className="text-sm font-semibold">Pedido mínimo (€)<input className={field} defaultValue={euros(coupon?.minOrderCents)} min="0" name="minOrder" step="0.01" type="number" /></label>
          <label className="text-sm font-semibold">Máximo de usos<input className={field} defaultValue={coupon?.maxRedemptions ?? ""} min="1" name="maxRedemptions" step="1" type="number" /></label>
          <label className="text-sm font-semibold">Válido desde<input className={field} defaultValue={localDate(coupon?.startsAt)} name="startsAt" type="datetime-local" /></label>
          <label className="text-sm font-semibold">Válido hasta<input className={field} defaultValue={localDate(coupon?.endsAt)} name="endsAt" type="datetime-local" /></label>
          <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2"><input defaultChecked={coupon?.isActive ?? true} name="isActive" type="checkbox" /> Cupón activo</label>
        </section>
        <button className="rounded bg-[var(--rr-navy-900)] px-6 py-3 font-bold text-white" type="submit">Guardar cupón</button>
      </form>
      {coupon && !coupon.archivedAt ? <form action={archiveCoupon}><input name="id" type="hidden" value={coupon.id} /><button className="rounded border border-red-300 bg-white px-4 py-2 font-semibold text-red-700" type="submit">Archivar cupón</button></form> : null}
    </div>
  );
}
