"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { companySchema, type CompanyData, type CompanyInput } from "@/features/settings/schemas";
import { createTenant } from "@/features/tenants/actions";
import { showActionError } from "@/lib/form-errors";

export function NewTenantForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<CompanyInput, unknown, CompanyData>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "", document: "" },
  });

  // Em caso de sucesso a action redireciona para o dashboard da nova loja.
  const onSubmit = () =>
    startTransition(async () => {
      const result = await createTenant(form.getValues());
      if (result && !result.ok) showActionError(form, result);
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tenant-name">Nome da loja</FieldLabel>
              <Input {...field} id="tenant-name" autoFocus aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="document"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tenant-document">CNPJ ou CPF (opcional)</FieldLabel>
              <Input {...field} id="tenant-document" placeholder="00.000.000/0000-00" aria-invalid={fieldState.invalid} />
              <FieldDescription>Pode ser preenchido depois em Configurações.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Criando loja..." : "Criar loja"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
