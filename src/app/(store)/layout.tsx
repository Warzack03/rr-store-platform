import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartProvider } from "@/features/cart/cart-provider";
import { getPublicStoreSettings } from "@/features/settings/server/store-settings";

export default async function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicStoreSettings();
  const storeName = settings?.storeName ?? "Tienda Rising Raimon";
  const supportEmail = settings?.supportEmail ?? "risingraimon@gmail.com";
  const globalNotice = settings?.globalNoticeEnabled
    ? settings.globalNotice
    : null;

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader globalNotice={globalNotice} storeName={storeName} />
        <main id="contenido-principal" className="flex-1">
          {children}
        </main>
        <SiteFooter storeName={storeName} supportEmail={supportEmail} />
      </div>
    </CartProvider>
  );
}
