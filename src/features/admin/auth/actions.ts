"use server";

import argon2 from "argon2";
import { AuthError } from "next-auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { getPrismaClient } from "@/server/db/client";
import { logNodeEgressIpDiagnostic } from "@/server/db/egress-ip-diagnostic";

import {
  authChallengeCookie,
  challengeCookieOptions,
  createAdminChallenge,
  readAdminChallenge,
  recoveryDisplayCookie,
} from "./challenge";
import { encryptAuthValue, encryptTotpSecret } from "./crypto";
import { clearRateLimit, consumeRateLimit } from "./rate-limit";
import { createRecoveryCodes, createTotpSecret } from "./totp";

export type AuthActionState = { error: string | null };

const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});
const codeSchema = z.object({ code: z.string().trim().min(6).max(32) });
const dummyPasswordHash = argon2.hash("not-a-real-admin-password", {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
});

async function requestIdentifier() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "local"
  );
}

export async function beginAdminLogin(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Introduce un email y una contraseña válidos." };
  }

  const identifier = `${await requestIdentifier()}:${parsed.data.email}`;
  if (!consumeRateLimit("admin-login", identifier)) {
    return {
      error: "Demasiados intentos. Espera unos minutos antes de volver a probar.",
    };
  }

  await logNodeEgressIpDiagnostic();
  const prisma = getPrismaClient();
  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });
  const validPassword = await argon2.verify(
    admin?.passwordHash ?? (await dummyPasswordHash),
    parsed.data.password,
  );

  if (!admin || !admin.isActive || !validPassword) {
    return { error: "El email o la contraseña no son correctos." };
  }

  let encryptedTotpSecret = admin.totpSecretEncrypted;
  if (!encryptedTotpSecret) {
    encryptedTotpSecret = encryptTotpSecret(createTotpSecret());
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { totpSecretEncrypted: encryptedTotpSecret },
    });
  }

  const setupRecoveryCodes = admin.totpEnabled ? null : createRecoveryCodes();
  const challenge = createAdminChallenge({
    adminId: admin.id,
    email: admin.email,
    sessionVersion: admin.sessionVersion,
    setupRecoveryCodes,
  });
  const cookieStore = await cookies();
  cookieStore.set(authChallengeCookie, challenge, challengeCookieOptions);
  clearRateLimit("admin-login", identifier);
  redirect("/admin/2fa");
}

export async function completeAdminLogin(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = codeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: "Introduce un código válido." };
  }

  const cookieStore = await cookies();
  const challengeValue = cookieStore.get(authChallengeCookie)?.value;
  const challenge = challengeValue ? readAdminChallenge(challengeValue) : null;
  if (!challenge || !challengeValue) {
    return { error: "La verificación ha caducado. Vuelve a identificarte." };
  }

  const identifier = `${await requestIdentifier()}:${challenge.adminId}`;
  if (!consumeRateLimit("admin-2fa", identifier)) {
    return {
      error: "Demasiados intentos. Espera unos minutos antes de volver a probar.",
    };
  }

  try {
    await signIn("admin-credentials", {
      challenge: challengeValue,
      code: parsed.data.code,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "El código no es correcto o ya fue utilizado." };
    }
    throw error;
  }

  clearRateLimit("admin-2fa", identifier);
  cookieStore.delete(authChallengeCookie);
  if (challenge.setupRecoveryCodes) {
    cookieStore.set(
      recoveryDisplayCookie,
      encryptAuthValue({ codes: challenge.setupRecoveryCodes }),
      { ...challengeCookieOptions, maxAge: 10 * 60 },
    );
    redirect("/admin/2fa?configuracion=completa");
  }

  redirect("/admin");
}

export async function acknowledgeRecoveryCodes() {
  const cookieStore = await cookies();
  cookieStore.delete(recoveryDisplayCookie);
  redirect("/admin");
}

export async function endAdminSession() {
  await signOut({ redirectTo: "/admin/login" });
}
