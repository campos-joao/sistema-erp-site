"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateCompany } from "@/features/settings/actions";
import { companySchema, type CompanyData, type CompanyInput } from "@/features/settings/schemas";
import { formatDocument } from "@/lib/document";
import { showActionError } from "@/lib/form-errors";

type CompanyFormProps = {
  company: { name: string; document: string | null };
  canManage: boolean;
};

export function CompanyForm({ company, canManage }: CompanyFormProps) {
  const [pending, startTransition] = useTransition();
  const form = useForm<CompanyInput, unknown, CompanyData>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: company.name, document: formatDocument(company.document) },
  });

  const onSubmit = (data: CompanyData) =>
    startTransition(async () => {
      const values = form.getValues();
      const result = await updateCompany(values);
      if (!result.ok) return showActionError(form, result);
      form.reset({ name: data.name, document: formatDocument(data.document) });
      toast.success("Dados da empresa atualizados");
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="company-name">Nome da empresa</FieldLabel>
                <Input {...field} id="company-name" disabled={!canManage} aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="document"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="company-document">CNPJ ou CPF</FieldLabel>
                <Input
                  {...field}
                  id="company-document"
                  placeholder="00.000.000/0000-00"
                  disabled={!canManage}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>Aceita o novo CNPJ alfanumérico.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
        {canManage && (
          <div>
            <Button type="submit" disabled={pending || !form.formState.isDirty}>
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        )}
      </FieldGroup>
    </form>
  );
}
