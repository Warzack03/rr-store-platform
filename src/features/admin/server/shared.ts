import "server-only";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function cents(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * 100);
}

export function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function parseDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function auditData(
  adminUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  changeSummary?: Prisma.InputJsonValue,
) {
  return {
    adminUserId,
    action,
    entityType,
    entityId,
    ...(changeSummary ? { changeSummary } : {}),
  };
}

export function refreshAdminAndStore() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export function uniqueSlug(base: string, suffix = "") {
  const slug = slugify(`${base}${suffix}`);
  return slug || `elemento-${Date.now()}`;
}

export function messageUrl(path: string, kind: "ok" | "error", message: string) {
  return `${path}?${kind}=${encodeURIComponent(message)}`;
}
