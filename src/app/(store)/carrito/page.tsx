import type { Metadata } from "next";

import { CartPageContent } from "@/features/cart/cart-page";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageContent />;
}
