import { cookies } from "next/headers";

import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdmin } from "@/features/admin/auth/session";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, cookieStore] = await Promise.all([requireAdmin(), cookies()]);
  const initialTheme =
    cookieStore.get("rr-admin-theme")?.value === "light" ? "light" : "dark";

  return <AdminShell email={admin.email} initialTheme={initialTheme}>{children}</AdminShell>;
}
