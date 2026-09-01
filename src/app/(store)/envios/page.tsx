import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/features/legal/legal-page";
export const metadata: Metadata = { ...legalMetadata.envios, alternates: { canonical: "/envios" } };
export default function Page() { return <LegalPage document="envios" />; }
