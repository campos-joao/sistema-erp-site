"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/features/auth/actions";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";

const FIELDS: { name: keyof SignUpInput; label: string; type: string; autoComplete: string }[] = [
  { name: "companyName", label: "Nome da empresa", type: "text", autoComplete: "organization" },
  { name: "name", label: "Seu nome", type: "text", autoComplete: "name" },
  { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
  { name: "password", label: "Senha", type: "password", autoComplete: "new-password" },
];

export function SignUpForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { companyName: "", name: "", email: "", password: "" },
  });

  const onSubmit = (values: SignUpInput) =>
    startTransition(async () => {
      const result = await signUpAction(values);
      if (result && !result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([name, messages]) =>
          form.setError(name as keyof SignUpInput, { message: messages?.[0] }),
        );
        toast.error(result.error);
      }
    });

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Crie sua conta</CardTitle>
        <CardDescription>Cadastre sua empresa e comece a usar o ERP</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {FIELDS.map(({ name, label, type, autoComplete }) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={name}>{label}</FieldLabel>
                    <Input {...field} id={name} type={type} autoComplete={autoComplete} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Criando conta..." : "Criar conta"}
              </Button>
              <FieldDescription className="text-center">
                Já tem conta? <Link href="/login">Entrar</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
