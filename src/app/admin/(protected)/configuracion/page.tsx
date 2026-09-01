import { requireAdmin } from "@/features/admin/auth/session";
import { Flash } from "@/features/admin/components/flash";
import { PageHeading } from "@/features/admin/components/page-heading";
import { smtpIsConfigured } from "@/features/email/server/mailer";
import { deleteRedirect, saveRedirect } from "@/features/settings/server/redirect-actions";
import { saveStoreSettings } from "@/features/settings/server/settings-actions";
import { getPrismaClient } from "@/server/db/client";

type Query = { ok?: string; error?: string };

const field = "mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Query> }) {
  await requireAdmin();
  const prisma = getPrismaClient();
  const [settings, shipping, redirects, query] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { id: 1 } }),
    prisma.shippingMethod.findUnique({ where: { kind: "HOME" } }),
    prisma.redirect.findMany({ orderBy: { createdAt: "desc" } }),
    searchParams,
  ]);
  const smtpReady = smtpIsConfigured();

  return (
    <div className="space-y-6">
      <PageHeading title="Configuración" description="Datos públicos, correo de soporte, entrega y URLs históricas de la tienda." />
      <Flash searchParams={query} />

      <section className={`rounded-xl border p-4 ${smtpReady ? "border-emerald-400/50 bg-emerald-500/10" : "border-amber-400/50 bg-amber-500/10"}`}>
        <h2 className="font-bold">Correo saliente</h2>
        <p className="mt-1 text-sm">{smtpReady ? "La configuración SMTP está completa. Los correos se enviarán al confirmar las acciones correspondientes." : "El correo saliente no está configurado. Los intentos quedarán registrados como fallidos hasta que se añadan las credenciales SMTP al entorno."}</p>
        <p className="mt-2 text-xs text-slate-500">Las credenciales se gestionan en las variables del servidor y nunca se muestran aquí.</p>
      </section>

      <form action={saveStoreSettings} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Tienda y soporte</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-semibold">Nombre de la tienda<input className={field} defaultValue={settings?.storeName ?? "Tienda Rising Raimon"} maxLength={191} name="storeName" required /></label>
            <label className="text-sm font-semibold">Email de soporte<input className={field} defaultValue={settings?.supportEmail ?? "risingraimon@gmail.com"} maxLength={320} name="supportEmail" required type="email" /></label>
            <label className="text-sm font-semibold lg:col-span-2">Estimación de entrega<textarea className={`${field} min-h-24 p-3`} defaultValue={settings?.deliveryEstimateText ?? "Entrega estimada tras la fabricación."} maxLength={500} name="deliveryEstimateText" required /></label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Envío a domicilio</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Tarifa con IVA (€)<input className={field} defaultValue={((shipping?.priceCents ?? 499) / 100).toFixed(2).replace(".", ",")} inputMode="decimal" name="shippingPrice" required /></label>
            <label className="flex items-center gap-3 self-end rounded border border-slate-200 p-3 font-semibold"><input defaultChecked={shipping?.isEnabled ?? true} name="shippingEnabled" type="checkbox" />Envío a domicilio activo</label>
          </div>
          <p className="mt-3 text-sm text-slate-500">Si se desactiva, ningún comprador podrá iniciar el checkout.</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Aviso global</h2>
          <label className="mt-4 block text-sm font-semibold">Mensaje<textarea className={`${field} min-h-24 p-3`} defaultValue={settings?.globalNotice ?? ""} maxLength={1_000} name="globalNotice" placeholder="Ejemplo: Los pedidos realizados esta semana se prepararán a partir del lunes." /></label>
          <label className="mt-4 flex items-center gap-3 font-semibold"><input defaultChecked={settings?.globalNoticeEnabled ?? false} name="globalNoticeEnabled" type="checkbox" />Mostrar aviso en toda la tienda</label>
        </section>

        <button className="rounded bg-[var(--rr-gold-400)] px-5 py-3 font-bold text-[var(--rr-navy-950)]" type="submit">Guardar configuración</button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" id="redirects">
        <h2 className="text-xl font-bold">Redirects 301</h2>
        <p className="mt-1 text-sm text-slate-500">Conecta una URL antigua útil de WooCommerce con su equivalente en la tienda nueva. Puedes pegar la URL antigua completa.</p>
        <form action={saveRedirect} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-semibold">URL o ruta antigua<input className={field} maxLength={2_048} name="fromPath" placeholder="https://tienda…/producto/camiseta/" required /></label>
          <label className="text-sm font-semibold">Destino nuevo<input className={field} maxLength={2_048} name="toPath" placeholder="/productos/camiseta" required /></label>
          <button className="self-end rounded bg-[var(--rr-navy-900)] px-4 py-2 font-semibold text-white" type="submit">Guardar 301</button>
        </form>

        {redirects.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500"><tr><th className="p-3">Origen</th><th className="p-3">Destino</th><th className="p-3">Acción</th></tr></thead>
              <tbody>{redirects.map((item) => <tr className="border-b border-slate-100" key={item.id}><td className="p-3 font-mono text-xs">{item.fromPath}</td><td className="p-3 font-mono text-xs">{item.toPath}</td><td className="p-3"><form action={deleteRedirect}><input name="id" type="hidden" value={item.id} /><button className="rounded border border-red-300 px-3 py-2 font-semibold text-red-700" type="submit">Eliminar</button></form></td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="mt-5 text-sm text-slate-500">Todavía no hay redirects manuales.</p>}
      </section>
    </div>
  );
}
