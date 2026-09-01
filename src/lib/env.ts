import { z } from "zod";

const runtimeEnvironmentSchema = z.object({
  STORE_ENV: z.enum(["local", "beta", "production"]).default("local"),
  SITE_URL: z.url().default("http://localhost:3000"),
  MEDIA_ROOT: z.string().trim().min(1).optional(),
  GOOGLE_SITE_VERIFICATION: z.string().trim().min(8).max(255).optional(),
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
const stripeSecretKeySchema = z.string().trim().startsWith("sk_");
const stripeWebhookSecretSchema = z.string().trim().startsWith("whsec_");
const smtpSchema = z.object({
  host: z.string().trim().min(1),
  port: z.coerce.number().int().min(1).max(65_535),
  secure: z.enum(["true", "false"]).transform((value) => value === "true"),
  user: z.string().trim().min(1),
  password: z.string().min(1),
  fromEmail: z.email(),
  fromName: z.string().trim().min(1).max(191).optional(),
});

const parsedRuntimeEnvironment = runtimeEnvironmentSchema.safeParse({
  STORE_ENV: process.env.STORE_ENV,
  SITE_URL: process.env.SITE_URL,
  MEDIA_ROOT: process.env.MEDIA_ROOT,
  GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
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

export function getStripeSecretKey(): string | null {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) return null;
  const parsed = stripeSecretKeySchema.safeParse(value);
  if (!parsed.success) throw new Error("La configuración de Stripe no es válida.");
  return parsed.data;
}

export function getStripeWebhookSecret(): string | null {
  const value = process.env.STRIPE_WEBHOOK_SECRET;
  if (!value) return null;
  const parsed = stripeWebhookSecretSchema.safeParse(value);
  if (!parsed.success) throw new Error("La configuración del webhook de Stripe no es válida.");
  return parsed.data;
}

export function getSmtpConfig() {
  const values = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ?? "465",
    secure: process.env.SMTP_SECURE ?? "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromEmail: process.env.SMTP_FROM_EMAIL,
    fromName: process.env.SMTP_FROM_NAME || undefined,
  };
  if (!values.host && !values.user && !values.password && !values.fromEmail) return null;
  const parsed = smtpSchema.safeParse(values);
  if (!parsed.success) throw new Error("La configuración SMTP no es válida.");
  return parsed.data;
}
