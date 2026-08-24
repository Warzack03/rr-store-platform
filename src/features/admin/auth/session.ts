import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { getPrismaClient } from "@/server/db/client";

export const getVerifiedAdmin = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const admin = await getPrismaClient().adminUser.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      isActive: true,
      sessionVersion: true,
      totpEnabled: true,
    },
  });

  if (
    !admin?.isActive ||
    !admin.totpEnabled ||
    admin.sessionVersion !== session.user.sessionVersion
  ) {
    return null;
  }

  return admin;
});

export async function requireAdmin() {
  const admin = await getVerifiedAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
