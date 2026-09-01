import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/features/legal/legal-page";
export const metadata: Metadata = { ...legalMetadata["condiciones-de-compra"], alternates: { canonical: "/condiciones-de-compra" } };
export default function Page() { return <LegalPage document="condiciones-de-compra" />; }
