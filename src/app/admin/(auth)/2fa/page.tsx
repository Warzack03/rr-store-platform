import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { BrandMark } from "@/components/brand/brand-mark";
import {
  acknowledgeRecoveryCodes,
} from "@/features/admin/auth/actions";
import {
  authChallengeCookie,
  readAdminChallenge,
  recoveryDisplayCookie,
} from "@/features/admin/auth/challenge";
import {
  decryptAuthValue,
  decryptTotpSecret,
} from "@/features/admin/auth/crypto";
import { getVerifiedAdmin } from "@/features/admin/auth/session";
import { createTotp } from "@/features/admin/auth/totp";
import { TwoFactorForm } from "@/features/admin/auth/two-factor-form";
import { getPrismaClient } from "@/server/db/client";

type TwoFactorPageProps = {
  searchParams: Promise<{ configuracion?: string }>;
};

export default async function TwoFactorPage({
  searchParams,
}: TwoFactorPageProps) {
  const query = await searchParams;
  const cookieStore = await cookies();

  if (query.configuracion === "completa") {
    if (!(await getVerifiedAdmin())) redirect("/admin/login");
    const recoveryValue = cookieStore.get(recoveryDisplayCookie)?.value;
    const recoveryCodes = recoveryValue
      ? decryptAuthValue<{ codes: string[] }>(recoveryValue)?.codes
      : null;
    if (!recoveryCodes) redirect("/admin");

    return (
      <AuthCard title="Guarda tus códigos de recuperación">
        <p className="text-sm leading-6 text-white/65">
          Cada código sirve una sola vez si pierdes acceso a tu aplicación de
          autenticación. Guárdalos ahora en un lugar seguro; no volverán a
          mostrarse.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-2 border border-white/12 bg-[#07101d] p-4 font-mono text-sm text-white">
          {recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <form action={acknowledgeRecoveryCodes} className="mt-7">
          <button className="inline-flex min-h-12 w-full items-center justify-center border border-brand-gold bg-brand-gold px-6 font-heading font-bold uppercase tracking-[0.12em] text-brand-panel hover:bg-[#ffe19a]">
            Ya los he guardado
          </button>
        </form>
      </AuthCard>
    );
  }

  if (await getVerifiedAdmin()) redirect("/admin");
  const challengeValue = cookieStore.get(authChallengeCookie)?.value;
  const challenge = challengeValue ? readAdminChallenge(challengeValue) : null;
  if (!challenge) redirect("/admin/login");

  const admin = await getPrismaClient().adminUser.findUnique({
    where: { id: challenge.adminId },
    select: { email: true, totpEnabled: true, totpSecretEncrypted: true },
  });
  if (!admin?.totpSecretEncrypted) redirect("/admin/login");

  const setup = !admin.totpEnabled;
  const secret = decryptTotpSecret(admin.totpSecretEncrypted);
  if (!secret) redirect("/admin/login");
  const qrCode = setup
    ? await QRCode.toDataURL(createTotp(secret, admin.email).toString(), {
        width: 240,
        margin: 1,
        color: { dark: "#07101d", light: "#ffffff" },
      })
    : null;

  return (
    <AuthCard title={setup ? "Protege tu cuenta" : "Verificación en dos pasos"}>
      {setup ? (
        <div>
          <p className="text-sm leading-6 text-white/65">
            Escanea este QR con tu aplicación de autenticación y escribe el código
            de seis dígitos para activar la protección.
          </p>
          <div className="mx-auto mt-6 w-fit bg-white p-3">
            <Image
              src={qrCode!}
              alt="Código QR para configurar la autenticación en dos pasos"
              width={240}
              height={240}
              unoptimized
            />
          </div>
          <details className="mt-4 text-center text-sm text-white/58">
            <summary className="cursor-pointer hover:text-brand-gold">
              Introducir clave manualmente
            </summary>
            <code className="mt-2 block break-all text-brand-gold">{secret}</code>
          </details>
        </div>
      ) : (
        <p className="text-sm leading-6 text-white/65">
          Introduce el código de tu aplicación de autenticación. También puedes
          utilizar uno de tus códigos de recuperación.
        </p>
      )}
      <TwoFactorForm setup={setup} />
    </AuthCard>
  );
}

function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main
      id="contenido-principal"
      className="flex min-h-screen items-center justify-center bg-[#07101d] px-5 py-12"
    >
      <div className="w-full max-w-lg border border-white/12 bg-[#0b1b31] p-6 shadow-2xl sm:p-9">
        <div className="flex items-center gap-3">
          <BrandMark priority size={44} />
          <span className="font-heading font-bold uppercase tracking-[0.12em] text-brand-gold">
            Administración
          </span>
        </div>
        <h1 className="mt-8 font-display text-5xl leading-none tracking-wide text-white">
          {title}
        </h1>
        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}
