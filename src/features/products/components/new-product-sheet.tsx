"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createProduct } from "@/features/products/actions";
import { createProductSchema, type CreateProductInput } from "@/features/products/schemas";

const DEFAULT_VALUES: CreateProductInput = { name: "", sku: "", price: "" };

export function NewProductSheet() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) form.reset(DEFAULT_VALUES);
  };

  const onSubmit = (values: CreateProductInput) =>
    startTransition(async () => {
      const result = await createProduct(values);
      if (!result.ok) {
        Object.entries(result.fieldErrors ?? {}).forEach(([name, messages]) =>
          form.setError(name as keyof CreateProductInput, { message: messages?.[0] }),
        );
        toast.error(result.error);
        return;
      }
      toast.success("Produto cadastrado com sucesso");
      onOpenChange(false);
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <Plus />
          Novo produto
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>Novo produto</SheetTitle>
            <SheetDescription>Cadastre um produto simples. Variações e estoque virão depois.</SheetDescription>
          </SheetHeader>
          <FieldGroup className="flex-1 px-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-name">Nome</FieldLabel>
                  <Input {...field} id="product-name" autoFocus aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="sku"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-sku">SKU</FieldLabel>
                  <Input {...field} id="product-sku" aria-invalid={fieldState.invalid} />
                  <FieldDescription>Código único do produto dentro da sua empresa.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-price">Preço de venda (R$)</FieldLabel>
                  <Input {...field} id="product-price" inputMode="decimal" placeholder="0,00" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar produto"}
            </Button>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
