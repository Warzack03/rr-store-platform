import { NextResponse } from "next/server";

import { validateCart } from "@/features/cart/server/validate-cart";
import { storedCartSchema } from "@/features/cart/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }
  const parsed = storedCartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "El carrito no tiene un formato válido." },
      { status: 400 },
    );
  }
  return NextResponse.json(await validateCart(parsed.data), {
    headers: { "Cache-Control": "no-store" },
  });
}
