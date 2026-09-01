import "server-only";

import type Stripe from "stripe";

import { paymentStatusAfterRefunds, refundStatusFromStripe } from "@/features/orders/domain";
import { getPrismaClient } from "@/server/db/client";

export async function syncStripeRefund(refund: Stripe.Refund) {
  const paymentIntentId = typeof refund.payment_intent === "string"
    ? refund.payment_intent
    : refund.payment_intent?.id;
  if (!paymentIntentId) return null;
  const prisma = getPrismaClient();
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true, orderId: true, amountCents: true },
    });
    if (!payment) return null;
    await tx.refund.upsert({
      where: { stripeRefundId: refund.id },
      update: {
        amountCents: refund.amount,
        status: refundStatusFromStripe(refund.status),
        reason: refund.reason ?? null,
      },
      create: {
        paymentId: payment.id,
        stripeRefundId: refund.id,
        amountCents: refund.amount,
        status: refundStatusFromStripe(refund.status),
        reason: refund.reason ?? null,
      },
    });
    const refunds = await tx.refund.findMany({
      where: { paymentId: payment.id },
      select: { amountCents: true, status: true },
    });
    const status = paymentStatusAfterRefunds(payment.amountCents, refunds);
    await tx.payment.update({ where: { id: payment.id }, data: { status } });
    return { orderId: payment.orderId, paymentStatus: status };
  });
}
