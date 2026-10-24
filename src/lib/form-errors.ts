import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import type { ActionError } from "@/lib/action-result";

/** Aplica os erros de campo retornados por uma Server Action ao formulário e exibe o toast. */
export function showActionError<T extends FieldValues>(form: Pick<UseFormReturn<T>, "setError">, result: ActionError) {
  Object.entries(result.fieldErrors ?? {}).forEach(([name, messages]) =>
    form.setError(name as Path<T>, { message: messages?.[0] }),
  );
  toast.error(result.error);
}
