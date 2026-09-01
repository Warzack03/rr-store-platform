import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { fulfillCheckoutSession } from "@/features/checkout/server/fulfill-checkout";
import { sendOrderStatusEmail } from "@/features/email/server/deliver-order-email";
import { getStripeClient } from "@/features/stripe/server/client";
import { syncStripeRefund } from "@/features/stripe/server/sync-refund";
import { getStripeWebhookSecret } from "@/lib/env";
import { getPrismaClient } from "@/server/db/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const secret = getStripeWebhookSecret();
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) return new NextResponse("Webhook no configurado.", { status: 503 });
  const payload = await request.text();
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(payload, signature, secret); } catch { return new NextResponse("Firma no válida.", { status: 400 }); }
  const prisma = getPrismaClient();
  const existing = await prisma.stripeEvent.findUnique({ where: { stripeEventId: event.id } });
  if (existing?.processingStatus === "PROCESSED") return NextResponse.json({ received: true });
  if (!existing) await prisma.stripeEvent.create({ data: { stripeEventId: event.id, type: event.type } }).catch(() => undefined);
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session, new Date(event.created * 1_000));
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await prisma.checkoutAttempt.updateMany({ where: { stripeCheckoutSessionId: session.id, status: { in: ["CREATED", "REDIRECTED"] } }, data: { status: "EXPIRED" } });
    } else if (event.type === "refund.created" || event.type === "refund.updated" || event.type === "refund.failed") {
      const refund = await syncStripeRefund(event.data.object as Stripe.Refund);
      if (refund && refund.paymentStatus !== "PAID") await sendOrderStatusEmail(refund.orderId, "ORDER_CANCELLED_OR_REFUNDED");
    }
    await prisma.stripeEvent.update({ where: { stripeEventId: event.id }, data: { processingStatus: "PROCESSED", processedAt: new Date(), errorSummary: null } });
    return NextResponse.json({ received: true });
  } catch (error) {
    await prisma.stripeEvent.update({ where: { stripeEventId: event.id }, data: { processingStatus: "FAILED", errorSummary: error instanceof Error ? error.message.slice(0, 500) : "processing-error" } }).catch(() => undefined);
    return new NextResponse("No se ha podido procesar el evento.", { status: 500 });
  }
}
