import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/features/admin/auth/rate-limit";
import { validateCart } from "@/features/cart/server/validate-cart";
import { storedCartSchema } from "@/features/cart/storage";
import { checkoutExpiry, checkoutInputSchema, isPeninsularPostalCode } from "@/features/checkout/domain";
import { getStripeClient } from "@/features/stripe/server/client";
import { env } from "@/lib/env";
import { getPrismaClient } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(env.SITE_URL).origin) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  const identifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!consumeRateLimit("checkout", identifier, 10, 60 * 60 * 1_000)) {
    return NextResponse.json({ error: "Has realizado demasiados intentos. Espera unos minutos." }, { status: 429 });
  }
  const stripe = getStripeClient();
  if (!stripe) return NextResponse.json({ error: "El pago de prueba todavía no está configurado." }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 }); }
  const input = checkoutInputSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ error: "Revisa los datos obligatorios del formulario." }, { status: 400 });
  if (!isPeninsularPostalCode(input.data.postalCode)) return NextResponse.json({ error: "Actualmente solo realizamos envíos a Península." }, { status: 400 });
  const cart = storedCartSchema.safeParse(input.data.cart);
  if (!cart.success) return NextResponse.json({ error: "El carrito no es válido." }, { status: 400 });
  const validated = await validateCart(cart.data);
  if (!validated.dropId || validated.lines.length === 0 || validated.issues.length > 0 || validated.couponError) {
    return NextResponse.json({ error: validated.couponError ?? validated.issues[0] ?? "El carrito ya no está disponible." }, { status: 409 });
  }
  const prisma = getPrismaClient();
  const shipping = await prisma.shippingMethod.findUnique({ where: { kind: "HOME" } });
  if (!shipping?.isEnabled) return NextResponse.json({ error: "El envío a domicilio no está disponible en este momento." }, { status: 409 });

  const createdAt = new Date();
  const expiresAt = checkoutExpiry(createdAt);
  const publicToken = randomBytes(32).toString("base64url");
  const totalCents = validated.totalCents + shipping.priceCents;
  const shippingSnapshot = {
    kind: "HOME",
    displayName: shipping.displayName,
    priceCents: shipping.priceCents,
    address: {
      countryCode: "ES",
      postalCode: input.data.postalCode,
      province: input.data.province,
      city: input.data.city,
      street: input.data.street,
      streetNumber: input.data.streetNumber,
      additionalLine: input.data.additionalLine || null,
    },
  };
  const attempt = await prisma.checkoutAttempt.create({
    data: {
      publicToken,
      dropId: validated.dropId,
      email: input.data.email.toLowerCase(),
      firstName: input.data.firstName,
      lastName: input.data.lastName,
      phone: input.data.phone,
      notes: input.data.notes || null,
      subtotalCents: validated.subtotalCents,
      discountCents: validated.discountCents,
      shippingCents: shipping.priceCents,
      totalCents,
      couponId: validated.coupon ? (await prisma.coupon.findUnique({ where: { code: validated.coupon.code }, select: { id: true } }))?.id ?? null : null,
      shippingKind: "HOME",
      shippingSnapshot,
      cartSnapshot: validated,
      expiresAt,
    },
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: attempt.email,
      payment_method_types: ["card"],
      line_items: [{ price_data: { currency: "eur", unit_amount: totalCents, product_data: { name: `Pedido Rising Raimon · ${validated.dropTitle ?? "Drop"}` } }, quantity: 1 }],
      metadata: { checkoutAttemptId: attempt.id },
      payment_intent_data: { metadata: { checkoutAttemptId: attempt.id } },
      success_url: new URL(`/pedido/${publicToken}`, env.SITE_URL).toString(),
      cancel_url: new URL("/checkout/cancelado", env.SITE_URL).toString(),
      expires_at: Math.floor(expiresAt.valueOf() / 1_000),
      locale: "es",
    }, { idempotencyKey: `checkout-attempt-${attempt.id}` });
    if (!session.url) throw new Error("missing-session-url");
    await prisma.checkoutAttempt.update({ where: { id: attempt.id }, data: { status: "REDIRECTED", stripeCheckoutSessionId: session.id } });
    return NextResponse.json({ url: session.url });
  } catch {
    await prisma.checkoutAttempt.update({ where: { id: attempt.id }, data: { status: "FAILED" } }).catch(() => undefined);
    return NextResponse.json({ error: "No hemos podido preparar el pago. Inténtalo de nuevo." }, { status: 502 });
  }
}
