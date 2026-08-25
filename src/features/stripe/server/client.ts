import "server-only";

import Stripe from "stripe";

import { getStripeSecretKey } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripeClient() {
  const secretKey = getStripeSecretKey();
  if (!secretKey) return null;
  stripe ??= new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 10_000 });
  return stripe;
}
