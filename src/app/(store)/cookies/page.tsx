import type { Metadata } from "next";
import { LegalPage, legalMetadata } from "@/features/legal/legal-page";
export const metadata: Metadata = { ...legalMetadata.cookies, alternates: { canonical: "/cookies" } };
export default function Page() { return <LegalPage document="cookies" />; }
