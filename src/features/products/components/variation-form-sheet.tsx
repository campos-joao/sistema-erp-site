"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
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
import { createVariation, updateVariation } from "@/features/products/actions";
import type { VariationRow } from "@/features/products/queries";
import { variationSchema, type VariationData, type VariationInput } from "@/features/products/schemas";
import { showActionError } from "@/lib/form-errors";
import { formatCurrency, toMoneyInput } from "@/lib/format";

type VariationFormSheetProps = {
  trigger: React.ReactNode;
  product: { id: string; sku: string; price: string };
  variation?: VariationRow;
};

export function VariationFormSheet({ trigger, product, variation }: VariationFormSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const defaults: VariationInput = {
    sku: variation?.sku ?? `${product.sku}-`,
    barcode: variation?.barcode ?? "",
    color: variation?.color ?? "",
    size: variation?.size ?? "",
    price: toMoneyInput(variation?.price),
    cost: toMoneyInput(variation?.cost),
  };
  const form = useForm<VariationInput, unknown, VariationData>({
    resolver: zodResolver(variationSchema),
    defaultValues: defaults,
  });

  const fields: { name: Path<VariationInput>; label: string; description?: string; decimal?: boolean }[] = [
    { name: "color", label: "Cor" },
    { name: "size", label: "Tamanho" },
    { name: "sku", label: "SKU", description: "Único entre produtos e variações." },
    { name: "barcode", label: "Código de barras (opcional)" },
    {
      name: "price",
      label: "Preço (R$, opcional)",
      description: `Em branco usa o preço do produto (${formatCurrency(product.price)}).`,
      decimal: true,
    },
    { name: "cost", label: "Custo (R$, opcional)", description: "Em branco usa o custo do produto.", decimal: true },
  ];

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) form.reset(defaults);
  };

  const onSubmit = () =>
    startTransition(async () => {
      const values = form.getValues();
      const result = variation ? await updateVariation(variation.id, values) : await createVariation(product.id, values);
      if (!result.ok) return showActionError(form, result);
      toast.success(variation ? "Variação atualizada" : "Variação cadastrada");
      setOpen(false);
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex h-full flex-col overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{variation ? "Editar variação" : "Nova variação"}</SheetTitle>
            <SheetDescription>Informe a cor e/ou o tamanho. O estoque passa a ser controlado por variação.</SheetDescription>
          </SheetHeader>
          <FieldGroup className="flex-1 px-4">
            {fields.map(({ name, label, description, decimal }, index) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`variation-${name}`}>{label}</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={`variation-${name}`}
                      autoFocus={index === 0}
                      inputMode={decimal ? "decimal" : undefined}
                      placeholder={decimal ? "0,00" : undefined}
                      aria-invalid={fieldState.invalid}
                    />
                    {description && <FieldDescription>{description}</FieldDescription>}
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
          </FieldGroup>
          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar variação"}
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
