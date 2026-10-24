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
import { createProduct, updateProduct } from "@/features/products/actions";
import { productSchema, type ProductData, type ProductInput } from "@/features/products/schemas";
import { showActionError } from "@/lib/form-errors";
import { toMoneyInput } from "@/lib/format";

const EMPTY: ProductInput = { name: "", sku: "", barcode: "", price: "", cost: "" };

type ProductFormSheetProps = {
  trigger: React.ReactNode;
  product?: { id: string; name: string; sku: string; barcode: string | null; price: string; cost: string | null };
};

const FIELDS: {
  name: Path<ProductInput>;
  label: string;
  description?: string;
  inputMode?: "decimal";
  placeholder?: string;
}[] = [
  { name: "name", label: "Nome" },
  { name: "sku", label: "SKU", description: "Código único do produto dentro da sua empresa." },
  { name: "barcode", label: "Código de barras (opcional)" },
  { name: "price", label: "Preço de venda (R$)", inputMode: "decimal", placeholder: "0,00" },
  {
    name: "cost",
    label: "Custo (R$, opcional)",
    inputMode: "decimal",
    placeholder: "0,00",
    description: "Usado para calcular o valor do estoque.",
  },
];

export function ProductFormSheet({ trigger, product }: ProductFormSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const defaults: ProductInput = product
    ? {
        name: product.name,
        sku: product.sku,
        barcode: product.barcode ?? "",
        price: toMoneyInput(product.price),
        cost: toMoneyInput(product.cost),
      }
    : EMPTY;
  const form = useForm<ProductInput, unknown, ProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: defaults,
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) form.reset(defaults);
  };

  // A action revalida no servidor, então enviamos os valores crus do formulário.
  const onSubmit = () =>
    startTransition(async () => {
      const values = form.getValues();
      const result = product ? await updateProduct(product.id, values) : await createProduct(values);
      if (!result.ok) return showActionError(form, result);
      toast.success(product ? "Produto atualizado" : "Produto cadastrado com sucesso");
      setOpen(false);
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex h-full flex-col overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{product ? "Editar produto" : "Novo produto"}</SheetTitle>
            <SheetDescription>
              {product
                ? "Altere os dados do produto."
                : "Cadastre o produto. Variações (cor/tamanho) podem ser adicionadas depois."}
            </SheetDescription>
          </SheetHeader>
          <FieldGroup className="flex-1 px-4">
            {FIELDS.map(({ name, label, description, inputMode, placeholder }, index) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`product-${name}`}>{label}</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={`product-${name}`}
                      autoFocus={index === 0}
                      inputMode={inputMode}
                      placeholder={placeholder}
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
