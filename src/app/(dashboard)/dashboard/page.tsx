import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { getCurrentTenant } from "@/lib/dal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const tenant = await getCurrentTenant();

  return <PageHeader title="Dashboard" description={`Visão geral de ${tenant.name}`} />;
}
