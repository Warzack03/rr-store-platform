import { z } from "zod";

export const checkoutInputSchema = z.object({
  cart: z.unknown(),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(150),
  email: z.email().max(320),
  phone: z.string().trim().min(7).max(30).regex(/^[+\d][\d\s()-]+$/),
  postalCode: z.string().trim().regex(/^\d{5}$/),
  province: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(150),
  street: z.string().trim().min(2).max(191),
  streetNumber: z.string().trim().min(1).max(30),
  additionalLine: z.string().trim().max(191).optional().default(""),
  notes: z.string().trim().max(2_000).optional().default(""),
  legalAccepted: z.literal(true),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export function isPeninsularPostalCode(postalCode: string) {
  if (!/^\d{5}$/.test(postalCode)) return false;
  const province = Number(postalCode.slice(0, 2));
  return province >= 1 && province <= 52 && ![7, 35, 38, 51, 52].includes(province);
}

export function checkoutExpiry(createdAt: Date) {
  return new Date(createdAt.valueOf() + 30 * 60 * 1_000);
}

export function checkoutCanComplete(expiresAt: Date, eventCreatedAt: Date) {
  return eventCreatedAt <= expiresAt;
}
