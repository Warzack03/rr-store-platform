import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/features/legal/legal-page";
export const metadata: Metadata = { ...legalMetadata["cambios-y-devoluciones"], alternates: { canonical: "/cambios-y-devoluciones" } };
export default function Page() { return <LegalPage document="cambios-y-devoluciones" />; }
