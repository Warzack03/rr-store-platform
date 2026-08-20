import "dotenv/config";

import argon2 from "argon2";
import { z } from "zod";

import { getPrismaClient } from "../src/server/db/client";

const initialAdminSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
});

const parsedAdmin = initialAdminSchema.safeParse({
  email: process.env.ADMIN_INITIAL_EMAIL,
  password: process.env.ADMIN_INITIAL_PASSWORD,
});

if (!parsedAdmin.success) {
  console.error(
    "Define ADMIN_INITIAL_EMAIL y una ADMIN_INITIAL_PASSWORD de al menos 12 caracteres.",
  );
  process.exit(1);
}

const initialAdmin = parsedAdmin.data;
const prisma = getPrismaClient();

async function createInitialAdmin() {
  const existingAdmins = await prisma.adminUser.count();

  if (existingAdmins > 0) {
    throw new Error("Ya existe una cuenta administradora.");
  }

  const passwordHash = await argon2.hash(initialAdmin.password, {
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 1,
  });

  const admin = await prisma.$transaction(async (transaction) => {
    const createdAdmin = await transaction.adminUser.create({
      data: {
        email: initialAdmin.email,
        passwordHash,
      },
      select: { id: true, email: true },
    });

    await transaction.auditLog.create({
      data: {
        adminUserId: createdAdmin.id,
        action: "ADMIN_CREATED",
        entityType: "AdminUser",
        entityId: createdAdmin.id,
        changeSummary: { source: "initial_setup" },
      },
    });

    return createdAdmin;
  });

  console.log(`Cuenta administradora inicial creada para ${admin.email}.`);
}

createInitialAdmin()
  .catch((error: unknown) => {
    const message =
      error instanceof Error && error.message === "Ya existe una cuenta administradora."
        ? error.message
        : "No se ha podido crear la cuenta administradora inicial.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
