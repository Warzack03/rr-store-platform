import "server-only";

import { randomBytes } from "node:crypto";

import * as OTPAuth from "otpauth";

export function createTotpSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function createTotp(secret: string, email: string) {
  return new OTPAuth.TOTP({
    issuer: "Rising Raimon",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export function verifyTotp(secret: string, email: string, token: string) {
  return createTotp(secret, email).validate({ token, window: 1 }) !== null;
}

export function createRecoveryCodes(amount = 8) {
  return Array.from({ length: amount }, () => {
    const value = randomBytes(6).toString("hex").toUpperCase();
    return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
  });
}

export function normalizeRecoveryCode(value: string) {
  return value.replaceAll(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
