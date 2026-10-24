"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { removeMember, resetMemberPassword, updateMemberRole } from "@/features/settings/actions";
import { TempPasswordDialog } from "@/features/settings/components/temp-password-dialog";
import type { UserRow } from "@/features/settings/queries";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/permissions";

type UsersTableProps = {
  users: UserRow[];
  currentUserId: string;
  canManage: boolean;
};

export function UsersTable({ users, currentUserId, canManage }: UsersTableProps) {
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const onRoleChange = (user: UserRow, role: string) =>
    startTransition(async () => {
      const result = await updateMemberRole(user.id, role);
      if (!result.ok) toast.error(result.error);
      else toast.success(`Perfil de ${user.name} atualizado`);
    });

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Desde</TableHead>
              {canManage && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {isSelf && (
                      <Badge variant="outline" className="ml-2">
                        Você
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {canManage && !isSelf ? (
                      <Select value={user.role} onValueChange={(role) => onRoleChange(user, role)} disabled={pending}>
                        <SelectTrigger size="sm" aria-label={`Perfil de ${user.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{ROLE_LABELS[user.role]}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  {canManage && (
                    <TableCell>
                      {!isSelf && (
                        <div className="flex justify-end">
                          <ConfirmDialog
                            title="Gerar nova senha?"
                            description={
                              <>
                                A senha atual de <strong>{user.name}</strong> deixará de funcionar e uma senha temporária
                                será exibida.
                              </>
                            }
                            confirmLabel="Gerar senha"
                            successMessage="Nova senha gerada"
                            action={async () => {
                              const result = await resetMemberPassword(user.id);
                              if (result.ok) setCredentials({ email: user.email, password: result.data.tempPassword });
                              return result.ok ? { ok: true } : result;
                            }}
                            trigger={
                              <Button variant="ghost" size="icon-sm" aria-label={`Redefinir senha de ${user.name}`} title="Redefinir senha">
                                <KeyRound />
                              </Button>
                            }
                          />
                          <ConfirmDialog
                            title="Remover usuário?"
                            description={
                              <>
                                <strong>{user.name}</strong> perderá o acesso a esta loja imediatamente (o login
                                continua valendo para outras lojas). O histórico de movimentações dele é mantido.
                              </>
                            }
                            confirmLabel="Remover"
                            successMessage="Usuário removido"
                            action={() => removeMember(user.id)}
                            trigger={
                              <Button variant="ghost" size="icon-sm" aria-label={`Remover ${user.name}`} title="Remover">
                                <Trash2 className="text-destructive" />
                              </Button>
                            }
                          />
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TempPasswordDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
