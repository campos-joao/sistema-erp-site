import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listProductOptions } from "@/features/products/queries";
import { MovementDialog } from "@/features/stock/components/movement-dialog";
import { listLocationOptions } from "@/features/stock/queries";
import { requireSession } from "@/lib/dal";
import { can } from "@/lib/permissions";

/** Botão (Server Component) que carrega produtos/depósitos e abre o diálogo de movimentação. */
export async function NewMovementButton({ productId, variant = "default" }: { productId?: string; variant?: "default" | "outline" }) {
  const session = await requireSession();
  if (!can(session.role, "stock:move")) return null;

  const [products, locations] = await Promise.all([listProductOptions(), listLocationOptions()]);

  return (
    <MovementDialog
      products={products}
      locations={locations}
      defaultProductId={productId}
      trigger={
        <Button variant={variant}>
          <ArrowLeftRight />
          Movimentar estoque
        </Button>
      }
    />
  );
}
