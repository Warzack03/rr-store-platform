import { z } from "zod";

const runtimeEnvironmentSchema = z.object({
  STORE_ENV: z.enum(["local", "beta", "production"]).default("local"),
  SITE_URL: z.url().default("http://localhost:3000"),
  MEDIA_ROOT: z.string().trim().min(1).optional(),
});

const databaseUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    try {
      return new URL(value).protocol === "mysql:";
    } catch {
      return false;
    }
  });

const authSecretSchema = z.string().min(32);

const parsedRuntimeEnvironment = runtimeEnvironmentSchema.safeParse({
  STORE_ENV: process.env.STORE_ENV,
  SITE_URL: process.env.SITE_URL,
  MEDIA_ROOT: process.env.MEDIA_ROOT,
});

if (!parsedRuntimeEnvironment.success) {
  throw new Error("La configuración de entorno de la aplicación no es válida.");
}

export const env = parsedRuntimeEnvironment.data;

export function getDatabaseUrl(): string | null {
  const value = process.env.DATABASE_URL;

  if (!value) {
    return null;
  }

  const parsed = databaseUrlSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error("La configuración de la base de datos no es válida.");
  }

  return parsed.data;
}

export function getAuthSecret(): string {
  const parsed = authSecretSchema.safeParse(process.env.AUTH_SECRET);

  if (!parsed.success) {
    throw new Error("La configuración de autenticación no es válida.");
  }

  return parsed.data;
}
