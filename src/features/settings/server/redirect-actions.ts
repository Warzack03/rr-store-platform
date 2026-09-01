"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/features/admin/auth/session";
import { auditData, messageUrl } from "@/features/admin/server/shared";
import { normalizeRedirectPath } from "@/features/settings/redirect-domain";
import { getPrismaClient } from "@/server/db/client";

const rawPath = z.string().trim().min(1).max(2_048);
const idSchema = z.string().trim().min(1).max(30);
const target = "/admin/configuracion";

async function finalDestination(toPath: string, fromPath: string) {
  const prisma = getPrismaClient();
  const visited = new Set([fromPath]);
  let current = toPath;

  for (let step = 0; step < 20; step += 1) {
    if (visited.has(current)) throw new Error("redirect-cycle");
    visited.add(current);
    const next = await prisma.redirect.findUnique({
      where: { fromPath: current },
      select: { toPath: true },
    });
    if (!next) return current;
    current = next.toPath;
  }

  throw new Error("redirect-chain-too-long");
}

export async function saveRedirect(formData: FormData) {
  const parsed = z.object({ fromPath: rawPath, toPath: rawPath }).safeParse({
    fromPath: formData.get("fromPath"),
    toPath: formData.get("toPath"),
  });
  if (!parsed.success) {
    redirect(messageUrl(target, "error", "Introduce una URL antigua y un destino válidos."));
  }

  const fromPath = normalizeRedirectPath(parsed.data.fromPath);
  const requestedDestination = normalizeRedirectPath(parsed.data.toPath);
  if (!fromPath || !requestedDestination || fromPath === "/" || fromPath === requestedDestination) {
    redirect(messageUrl(target, "error", "Las rutas deben ser internas, distintas y no pueden redirigir el inicio."));
  }

  const admin = await requireAdmin();
  const prisma = getPrismaClient();
  try {
    const toPath = await finalDestination(requestedDestination, fromPath);
    await prisma.$transaction(async (tx) => {
      const saved = await tx.redirect.upsert({
        where: { fromPath },
        update: { toPath, statusCode: 301 },
        create: { fromPath, toPath, statusCode: 301 },
      });
      await tx.redirect.updateMany({
        where: { toPath: fromPath, fromPath: { not: saved.fromPath } },
        data: { toPath },
      });
      await tx.auditLog.create({
        data: auditData(admin.id, "REDIRECT_SAVED", "Redirect", saved.id, { fromPath, toPath }),
      });
    });
    revalidatePath("/admin/configuracion");
    redirect(messageUrl(target, "ok", "Redirect 301 guardado."));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(messageUrl(target, "error", "No se ha podido guardar porque crearía un bucle o una cadena inválida."));
  }
}

export async function deleteRedirect(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("id"));
  if (!parsed.success) redirect(messageUrl(target, "error", "No se ha podido identificar el redirect."));
  const admin = await requireAdmin();
  const prisma = getPrismaClient();
  const current = await prisma.redirect.findUnique({ where: { id: parsed.data } });
  if (!current) redirect(messageUrl(target, "error", "El redirect ya no existe."));
  await prisma.$transaction([
    prisma.redirect.delete({ where: { id: current.id } }),
    prisma.auditLog.create({ data: auditData(admin.id, "REDIRECT_DELETED", "Redirect", current.id, { fromPath: current.fromPath, toPath: current.toPath }) }),
  ]);
  revalidatePath("/admin/configuracion");
  redirect(messageUrl(target, "ok", "Redirect eliminado."));
}
