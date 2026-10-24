import { PageHeader } from "@/components/layout/page-header";
import { NewMovementButton } from "@/features/stock/components/new-movement-button";
import { StockNav } from "@/features/stock/components/stock-nav";

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Estoque" description="Saldos por depósito, movimentações e depósitos">
        <NewMovementButton />
      </PageHeader>
      <StockNav />
      {children}
    </>
  );
}
