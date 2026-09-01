import "server-only";

import nodemailer from "rr-nodemailer";

import { env, getSmtpConfig } from "@/lib/env";

const globalMailer = globalThis as unknown as {
  transporter: ReturnType<typeof nodemailer.createTransport> | undefined;
};

export function smtpIsConfigured() {
  try {
    return getSmtpConfig() !== null;
  } catch {
    return false;
  }
}

export function getMailTransporter() {
  const config = getSmtpConfig();
  if (!config) throw new Error("smtp-not-configured");
  if (!globalMailer.transporter) {
    globalMailer.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }
  return { transporter: globalMailer.transporter, config, siteUrl: env.SITE_URL };
}
