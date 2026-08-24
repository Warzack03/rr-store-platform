import "server-only";

import { env } from "@/lib/env";

import { decryptAuthValue, encryptAuthValue } from "./crypto";

export const authChallengeCookie =
  env.STORE_ENV === "production"
    ? "__Secure-rr-admin-challenge"
    : "rr-admin-challenge";
export const recoveryDisplayCookie =
  env.STORE_ENV === "production"
    ? "__Secure-rr-admin-recovery"
    : "rr-admin-recovery";

export type AdminChallenge = {
  adminId: string;
  email: string;
  sessionVersion: number;
  expiresAt: number;
  setupRecoveryCodes: string[] | null;
};

export function createAdminChallenge(
  challenge: Omit<AdminChallenge, "expiresAt">,
) {
  return encryptAuthValue({
    ...challenge,
    expiresAt: Date.now() + 5 * 60 * 1_000,
  } satisfies AdminChallenge);
}

export function readAdminChallenge(value: string) {
  const challenge = decryptAuthValue<AdminChallenge>(value);
  if (!challenge || challenge.expiresAt <= Date.now()) return null;
  return challenge;
}

export const challengeCookieOptions = {
  httpOnly: true,
  secure: env.STORE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
  maxAge: 5 * 60,
};
