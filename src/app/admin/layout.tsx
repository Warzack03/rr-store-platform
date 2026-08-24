import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Administración",
    template: "%s | Administración Rising Raimon",
  },
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
