import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/features/legal/legal-page";
export const metadata: Metadata = { ...legalMetadata["aviso-legal"], alternates: { canonical: "/aviso-legal" } };
export default function Page() { return <LegalPage document="aviso-legal" />; }
