import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { getAuthSecret } from "@/lib/env";

const version = "v1";

function encryptionKey() {
  return createHash("sha256").update(getAuthSecret()).digest();
}

export function encryptAuthValue(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    version,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptAuthValue<T>(value: string): T | null {
  try {
    const [tokenVersion, encodedIv, encodedTag, encodedValue] = value.split(".");
    if (
      tokenVersion !== version ||
      !encodedIv ||
      !encodedTag ||
      !encodedValue
    ) {
      return null;
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(encodedIv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encodedValue, "base64url")),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function encryptTotpSecret(secret: string) {
  return encryptAuthValue({ secret });
}

export function decryptTotpSecret(value: string) {
  return decryptAuthValue<{ secret: string }>(value)?.secret ?? null;
}
