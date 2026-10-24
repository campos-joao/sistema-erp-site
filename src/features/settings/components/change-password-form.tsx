"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changeOwnPassword } from "@/features/settings/actions";
import { changePasswordSchema, type ChangePasswordInput } from "@/features/settings/schemas";
import { showActionError } from "@/lib/form-errors";

const DEFAULTS: ChangePasswordInput = { currentPassword: "", newPassword: "", confirmPassword: "" };

const FIELDS: { name: keyof ChangePasswordInput; label: string; autoComplete: string }[] = [
  { name: "currentPassword", label: "Senha atual", autoComplete: "current-password" },
  { name: "newPassword", label: "Nova senha", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirmar nova senha", autoComplete: "new-password" },
];

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: DEFAULTS });

  const onSubmit = (values: ChangePasswordInput) =>
    startTransition(async () => {
      const result = await changeOwnPassword(values);
      if (!result.ok) return showActionError(form, result);
      form.reset(DEFAULTS);
      toast.success("Senha alterada");
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-3">
          {FIELDS.map(({ name, label, autoComplete }) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`password-${name}`}>{label}</FieldLabel>
                  <Input
                    {...field}
                    id={`password-${name}`}
                    type="password"
                    autoComplete={autoComplete}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          ))}
        </div>
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Alterar senha"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
