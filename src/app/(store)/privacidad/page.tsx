import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/features/legal/legal-page";
export const metadata: Metadata = { ...legalMetadata.privacidad, alternates: { canonical: "/privacidad" } };
export default function Page() { return <LegalPage document="privacidad" />; }
