import { Store } from "lucide-react";
import { cookies } from "next/headers";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireSession, requireUser } from "@/lib/dal";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, user, cookieStore] = await Promise.all([requireSession(), requireUser(), cookies()]);
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        tenants={user.tenants}
        activeTenantId={session.tenantId}
        user={{ name: session.name, email: session.email }}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="flex items-center gap-2 text-sm">
            <Store className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Loja:</span>
            <span className="font-medium">{session.tenantName}</span>
          </div>
        </header>
        {/* `key` remonta a página ao trocar de loja, limpando estados de formulários/filtros. */}
        <div key={session.tenantId} className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
