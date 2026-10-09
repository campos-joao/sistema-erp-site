import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Estoque" };

export default function StockPage() {
  return <PageHeader title="Estoque" description="Saldos por depósito (em breve)" />;
}
