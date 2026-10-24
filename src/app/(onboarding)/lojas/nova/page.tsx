import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewTenantForm } from "@/features/tenants/components/new-tenant-form";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = { title: "Criar nova loja" };

export default async function NewTenantPage() {
  const user = await requireUser();
  const hasTenants = user.tenants.length > 0;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Criar nova loja</CardTitle>
        <CardDescription>
          {hasTenants
            ? "A nova loja é uma empresa separada, com produtos, estoque e usuários próprios. Você será o administrador."
            : "Você ainda não tem acesso a nenhuma loja. Crie a sua para começar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <NewTenantForm />
        {hasTenants ? (
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft />
              Voltar
            </Link>
          </Button>
        ) : (
          <form action={logoutAction}>
            <Button variant="ghost" type="submit" className="w-full">
              Sair ({user.email})
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
