"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import type { ProductOption } from "@/features/products/queries";
import { createMovement } from "@/features/stock/actions";
import type { LocationOption } from "@/features/stock/queries";
import {
  MOVEMENT_TYPE_LABELS,
  movementSchema,
  type MovementData,
  type MovementInput,
} from "@/features/stock/schemas";
import { showActionError } from "@/lib/form-errors";
import { formatQuantity, variationLabel } from "@/lib/format";

type MovementDialogProps = {
  trigger: React.ReactNode;
  products: ProductOption[];
  locations: LocationOption[];
  defaultProductId?: string;
};

const QUANTITY_LABELS: Record<MovementInput["type"], { label: string; description: string }> = {
  IN: { label: "Quantidade de entrada", description: "Será somada ao saldo atual." },
  OUT: { label: "Quantidade de saída", description: "Será subtraída do saldo atual." },
  ADJUSTMENT: { label: "Saldo contado", description: "O saldo passa a ser exatamente este valor (inventário)." },
};

export function MovementDialog({ trigger, products, locations, defaultProductId }: MovementDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const defaults: MovementInput = {
    type: "IN",
    locationId: locations.length === 1 ? locations[0].id : "",
    productId: defaultProductId ?? "",
    variationId: "",
    quantity: "",
    note: "",
  };
  const form = useForm<MovementInput, unknown, MovementData>({
    resolver: zodResolver(movementSchema),
    defaultValues: defaults,
  });
  const [type, productId] = useWatch({ control: form.control, name: ["type", "productId"] });
  const product = products.find((p) => p.id === productId);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) form.reset(defaults);
  };

  const onSubmit = () =>
    startTransition(async () => {
      const values = form.getValues();
      const result = await createMovement(values);
      if (!result.ok) return showActionError(form, result);
      toast.success(`${MOVEMENT_TYPE_LABELS[values.type]} registrada. Novo saldo: ${formatQuantity(result.data.balanceAfter)}`);
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Nova movimentação</DialogTitle>
            <DialogDescription>Registre entradas, saídas ou ajustes de inventário.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="movement-type">Tipo</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="movement-type" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {Object.entries(MOVEMENT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="locationId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="movement-location">Depósito</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="movement-location" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="productId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="movement-product">Produto</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("variationId", "");
                    }}
                  >
                    <SelectTrigger id="movement-product" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder={products.length ? "Selecione" : "Nenhum produto cadastrado"} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-72">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} <span className="text-muted-foreground">({p.sku})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {product && product.variations.length > 0 && (
              <Controller
                name="variationId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="movement-variation">Variação</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="movement-variation" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-72">
                        {product.variations.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {variationLabel(v)} <span className="text-muted-foreground">({v.sku})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
            <Controller
              name="quantity"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="movement-quantity">{QUANTITY_LABELS[type].label}</FieldLabel>
                  <Input {...field} id="movement-quantity" inputMode="decimal" placeholder="0" aria-invalid={fieldState.invalid} />
                  <FieldDescription>{QUANTITY_LABELS[type].description}</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="movement-note">Observação (opcional)</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    id="movement-note"
                    placeholder="Ex.: NF 1234, devolução, perda..."
                    aria-invalid={fieldState.invalid}
                  />
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
              {pending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
