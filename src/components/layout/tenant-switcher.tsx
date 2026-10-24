"use client";

import { Boxes, Check, ChevronsUpDown, Loader2, Plus, Store } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { switchTenant } from "@/features/tenants/actions";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/permissions";

type TenantSwitcherProps = {
  tenants: { id: string; name: string; role: Role }[];
  activeTenantId: string;
};

export function TenantSwitcher({ tenants, activeTenantId }: TenantSwitcherProps) {
  const { isMobile } = useSidebar();
  const [pending, startTransition] = useTransition();
  const active = tenants.find((t) => t.id === activeTenantId);

  const onSelect = (tenantId: string) => {
    if (tenantId === activeTenantId) return;
    startTransition(async () => {
      const result = await switchTenant(tenantId);
      if (result && !result.ok) toast.error(result.error);
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent" disabled={pending}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Boxes className="size-4" />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">ERP</span>
                <span className="truncate text-xs text-muted-foreground">{active?.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Lojas</DropdownMenuLabel>
            <DropdownMenuGroup>
              {tenants.map((tenant) => (
                <DropdownMenuItem key={tenant.id} onSelect={() => onSelect(tenant.id)} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Store className="size-3.5" />
                  </div>
                  <div className="grid flex-1 leading-tight">
                    <span className="truncate">{tenant.name}</span>
                    <span className="text-xs text-muted-foreground">{ROLE_LABELS[tenant.role]}</span>
                  </div>
                  {tenant.id === activeTenantId && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/lojas/nova">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <span className="font-medium">Criar nova loja</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
