import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { LocationFormDialog } from "@/features/stock/components/location-form-dialog";
import { LocationsTable } from "@/features/stock/components/locations-table";
import { listLocations } from "@/features/stock/queries";
import { requireSession } from "@/lib/dal";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Depósitos" };

export default async function LocationsPage() {
  const [session, locations] = await Promise.all([requireSession(), listLocations()]);
  const canManage = can(session.role, "location:manage");

  return (
    <>
      {canManage && (
        <div className="flex justify-end">
          <LocationFormDialog
            trigger={
              <Button variant="outline">
                <Plus />
                Novo depósito
              </Button>
            }
          />
        </div>
      )}
      <LocationsTable locations={locations} canManage={canManage} />
    </>
  );
}
