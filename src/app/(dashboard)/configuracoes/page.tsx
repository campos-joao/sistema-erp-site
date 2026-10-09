import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Configurações" };

export default function SettingsPage() {
  return <PageHeader title="Configurações" description="Dados da empresa e usuários (em breve)" />;
}
