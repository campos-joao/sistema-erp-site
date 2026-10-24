"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createLocation, updateLocation } from "@/features/stock/actions";
import { locationSchema, type LocationInput } from "@/features/stock/schemas";
import { showActionError } from "@/lib/form-errors";

type LocationFormDialogProps = {
  trigger: React.ReactNode;
  location?: { id: string; name: string };
};

export function LocationFormDialog({ trigger, location }: LocationFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const defaults: LocationInput = { name: location?.name ?? "" };
  const form = useForm<LocationInput>({ resolver: zodResolver(locationSchema), defaultValues: defaults });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) form.reset(defaults);
  };

  const onSubmit = (values: LocationInput) =>
    startTransition(async () => {
      const result = location ? await updateLocation(location.id, values) : await createLocation(values);
      if (!result.ok) return showActionError(form, result);
      toast.success(location ? "Depósito atualizado" : "Depósito criado");
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{location ? "Renomear depósito" : "Novo depósito"}</DialogTitle>
            <DialogDescription>Locais físicos onde o estoque é guardado (loja, galpão, filial...).</DialogDescription>
          </DialogHeader>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="location-name">Nome</FieldLabel>
                <Input {...field} id="location-name" autoFocus aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
