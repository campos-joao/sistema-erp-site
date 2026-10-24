import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/features/settings/components/change-password-form";
import { CompanyForm } from "@/features/settings/components/company-form";
import { InviteMemberDialog } from "@/features/settings/components/invite-member-dialog";
import { UsersTable } from "@/features/settings/components/users-table";
import { listUsers } from "@/features/settings/queries";
import { getCurrentTenant, requireSession } from "@/lib/dal";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const [session, tenant, users] = await Promise.all([requireSession(), getCurrentTenant(), listUsers()]);
  const canManageCompany = can(session.role, "company:manage");
  const canManageUsers = can(session.role, "users:manage");

  return (
    <>
      <PageHeader title="Configurações" description="Dados da empresa, usuários e sua conta" />

      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
          <CardDescription>
            {canManageCompany ? "Dados cadastrais da empresa." : "Somente administradores podem alterar estes dados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyForm company={tenant} canManage={canManageCompany} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Pessoas com acesso ao ERP desta empresa.</CardDescription>
          {canManageUsers && (
            <CardAction>
              <InviteMemberDialog />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <UsersTable users={users} currentUserId={session.userId} canManage={canManageUsers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minha senha</CardTitle>
          <CardDescription>Logado como {session.email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </>
  );
}
