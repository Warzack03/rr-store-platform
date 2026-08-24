import argon2 from "argon2";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { getAuthSecret } from "@/lib/env";
import { getPrismaClient } from "@/server/db/client";
import { readAdminChallenge } from "@/features/admin/auth/challenge";
import { decryptTotpSecret } from "@/features/admin/auth/crypto";
import {
  normalizeRecoveryCode,
  verifyTotp,
} from "@/features/admin/auth/totp";

const credentialsSchema = z.object({
  challenge: z.string().min(1),
  code: z.string().trim().min(6).max(32),
});

const recoveryHashOptions = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
} as const;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getAuthSecret(),
  trustHost: true,
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      id: "admin-credentials",
      credentials: {
        challenge: { type: "text" },
        code: { type: "text" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const challenge = readAdminChallenge(parsed.data.challenge);
        if (!challenge) return null;

        const prisma = getPrismaClient();
        const admin = await prisma.adminUser.findUnique({
          where: { id: challenge.adminId },
          include: {
            recoveryCodes: {
              where: { usedAt: null },
              orderBy: { createdAt: "asc" },
            },
          },
        });
        if (
          !admin ||
          !admin.isActive ||
          admin.email !== challenge.email ||
          admin.sessionVersion !== challenge.sessionVersion ||
          !admin.totpSecretEncrypted
        ) {
          return null;
        }

        const totpSecret = decryptTotpSecret(admin.totpSecretEncrypted);
        if (!totpSecret) return null;

        const isTotpCode = /^\d{6}$/.test(parsed.data.code);
        const validTotp =
          isTotpCode && verifyTotp(totpSecret, admin.email, parsed.data.code);

        if (!admin.totpEnabled) {
          if (!validTotp || !challenge.setupRecoveryCodes) return null;

          const recoveryHashes = await Promise.all(
            challenge.setupRecoveryCodes.map((code) =>
              argon2.hash(normalizeRecoveryCode(code), recoveryHashOptions),
            ),
          );

          await prisma.$transaction(async (transaction) => {
            await transaction.adminRecoveryCode.deleteMany({
              where: { adminUserId: admin.id },
            });
            await transaction.adminUser.update({
              where: { id: admin.id },
              data: { totpEnabled: true, lastLoginAt: new Date() },
            });
            await transaction.adminRecoveryCode.createMany({
              data: recoveryHashes.map((codeHash) => ({
                adminUserId: admin.id,
                codeHash,
              })),
            });
            await transaction.auditLog.create({
              data: {
                adminUserId: admin.id,
                action: "ADMIN_TOTP_ENABLED",
                entityType: "AdminUser",
                entityId: admin.id,
              },
            });
          });
        } else if (validTotp) {
          await prisma.adminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
          });
        } else {
          const normalizedCode = normalizeRecoveryCode(parsed.data.code);
          let matchedRecoveryCodeId: string | null = null;

          for (const recoveryCode of admin.recoveryCodes) {
            const matches = await argon2.verify(
              recoveryCode.codeHash,
              normalizedCode,
            );
            if (matches && !matchedRecoveryCodeId) {
              matchedRecoveryCodeId = recoveryCode.id;
            }
          }

          if (!matchedRecoveryCodeId) return null;
          await prisma.$transaction([
            prisma.adminRecoveryCode.update({
              where: { id: matchedRecoveryCodeId },
              data: { usedAt: new Date() },
            }),
            prisma.adminUser.update({
              where: { id: admin.id },
              data: { lastLoginAt: new Date() },
            }),
            prisma.auditLog.create({
              data: {
                adminUserId: admin.id,
                action: "ADMIN_RECOVERY_CODE_USED",
                entityType: "AdminUser",
                entityId: admin.id,
              },
            }),
          ]);
        }

        return {
          id: admin.id,
          email: admin.email,
          sessionVersion: admin.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.adminId = user.id;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.adminId ?? token.sub ?? "");
        session.user.sessionVersion = Number(token.sessionVersion ?? -1);
      }
      return session;
    },
  },
});
