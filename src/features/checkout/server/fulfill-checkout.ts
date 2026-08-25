import "server-only";

import Stripe from "stripe";

import type { ValidatedCart } from "@/features/cart/validation-types";
import { checkoutCanComplete } from "@/features/checkout/domain";
import { getPrismaClient } from "@/server/db/client";

type ShippingSnapshot = {
  kind: "HOME";
  displayName: string;
  priceCents: number;
  address: { countryCode: string; postalCode: string; province: string; city: string; street: string; streetNumber: string; additionalLine: string | null };
};

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session, eventCreatedAt: Date) {
  if (session.payment_status !== "paid" || session.currency !== "eur") return null;
  const prisma = getPrismaClient();
  const attempt = await prisma.checkoutAttempt.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    include: { order: true, coupon: true },
  });
  if (!attempt) throw new Error("checkout-attempt-not-found");
  if (attempt.order) return attempt.order;
  if (!checkoutCanComplete(attempt.expiresAt, eventCreatedAt)) throw new Error("checkout-attempt-expired");
  if (session.amount_total !== attempt.totalCents) throw new Error("checkout-total-mismatch");
  const cart = attempt.cartSnapshot as unknown as ValidatedCart;
  const shipping = attempt.shippingSnapshot as unknown as ShippingSnapshot;
  if (!Array.isArray(cart.lines) || shipping.kind !== "HOME" || !shipping.address) throw new Error("checkout-snapshot-invalid");
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("payment-intent-missing");

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          publicToken: attempt.publicToken,
          checkoutAttemptId: attempt.id,
          dropId: attempt.dropId,
          email: attempt.email,
          firstName: attempt.firstName,
          lastName: attempt.lastName,
          phone: attempt.phone,
          notes: attempt.notes,
          subtotalCents: attempt.subtotalCents,
          discountCents: attempt.discountCents,
          shippingCents: attempt.shippingCents,
          totalCents: attempt.totalCents,
          couponCodeSnapshot: attempt.coupon?.code ?? null,
          couponTypeSnapshot: attempt.coupon?.type ?? null,
          couponValueSnapshot: attempt.coupon?.value ?? null,
          address: { create: shipping.address },
          shipment: { create: { kind: "HOME" } },
          payment: { create: { stripeCheckoutSessionId: session.id, stripePaymentIntentId: paymentIntentId, amountCents: attempt.totalCents, paidAt: eventCreatedAt } },
          statusHistory: { create: { toStatus: "RECEIVED", source: "STRIPE" } },
        },
      });
      for (const line of cart.lines) {
        const item = await tx.orderItem.create({ data: { orderId: order.id, productId: line.productId, dropProductId: cart.cart.lines.find((candidate) => candidate.id === line.id)?.dropProductId ?? null, productTypeSnapshot: line.productType, productNameSnapshot: line.name, productSlugSnapshot: line.slug, sizeLabelSnapshot: line.sizeLabel, unitBasePriceCents: line.unitBasePriceCents, unitCustomizationCents: line.unitCustomizationCents, unitTotalCents: line.unitTotalCents, quantity: line.quantity, lineTotalCents: line.lineTotalCents } });
        for (const [sortOrder, customization] of line.customizations.entries()) await tx.orderItemCustomization.create({ data: { orderItemId: item.id, type: customization.type, labelSnapshot: customization.label, valueSnapshot: customization.value, surchargeCentsSnapshot: customization.surchargeCents, sortOrder } });
        for (const [sortOrder, component] of line.components.entries()) {
          const savedComponent = await tx.orderItemComponent.create({ data: { orderItemId: item.id, componentLabelSnapshot: component.label, productNameSnapshot: component.productName, sizeLabelSnapshot: component.sizeLabel, sortOrder } });
          for (const [customSortOrder, customization] of component.customizations.entries()) await tx.orderItemCustomization.create({ data: { orderItemId: item.id, orderItemComponentId: savedComponent.id, type: customization.type, labelSnapshot: customization.label, valueSnapshot: customization.value, surchargeCentsSnapshot: customization.surchargeCents, sortOrder: customSortOrder } });
        }
      }
      if (attempt.couponId && attempt.discountCents > 0) await tx.couponRedemption.create({ data: { couponId: attempt.couponId, orderId: order.id, discountCents: attempt.discountCents } });
      await tx.checkoutAttempt.update({ where: { id: attempt.id }, data: { status: "PAID", paidAt: eventCreatedAt, stripePaymentIntentId: paymentIntentId } });
      return order;
    });
  } catch (error) {
    const existing = await prisma.order.findUnique({ where: { checkoutAttemptId: attempt.id } });
    if (existing) return existing;
    throw error;
  }
}
