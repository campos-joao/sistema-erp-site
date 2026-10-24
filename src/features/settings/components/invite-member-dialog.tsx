"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteMember } from "@/features/settings/actions";
import { TempPasswordDialog } from "@/features/settings/components/temp-password-dialog";
import { inviteMemberSchema, type InviteMemberInput } from "@/features/settings/schemas";
import { showActionError } from "@/lib/form-errors";
import { ROLE_LABELS } from "@/lib/permissions";

const DEFAULTS: InviteMemberInput = { name: "", email: "", role: "MEMBER" };

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<InviteMemberInput>({ resolver: zodResolver(inviteMemberSchema), defaultValues: DEFAULTS });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) form.reset(DEFAULTS);
  };

  const onSubmit = (values: InviteMemberInput) =>
    startTransition(async () => {
      const result = await inviteMember(values);
      if (!result.ok) return showActionError(form, result);
      setOpen(false);
      const { tempPassword } = result.data;
      if (!tempPassword) {
        toast.success("Usuário adicionado. Ele já tem login e entra com a senha atual.");
        return;
      }
      toast.success("Usuário adicionado");
      setCredentials({ email: values.email.trim().toLowerCase(), password: tempPassword });
    });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus />
            Adicionar usuário
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Adicionar usuário</DialogTitle>
              <DialogDescription>
                Se o e-mail ainda não tiver login, uma senha temporária será gerada para você repassar. Se já tiver
                (ex.: usuário de outra loja), ele só ganha acesso a esta loja.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="invite-name">Nome</FieldLabel>
                    <Input {...field} id="invite-name" autoFocus aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="invite-email">E-mail</FieldLabel>
                    <Input {...field} id="invite-email" type="email" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="invite-role">Perfil</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="invite-role" className="w-full">
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
                    <FieldDescription>
                      Membros cadastram produtos e movimentam estoque. Administradores também excluem, gerenciam
                      depósitos, empresa e usuários.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <TempPasswordDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
