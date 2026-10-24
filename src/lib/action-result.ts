import { z } from "zod";

export type ActionError = { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export type ActionResult<T = void> = ([T] extends [void] ? { ok: true } : { ok: true; data: T }) | ActionError;

export const fail = (error: string, fieldErrors?: ActionError["fieldErrors"]): ActionError => ({
  ok: false,
  error,
  fieldErrors,
});

export const invalid = (error: z.ZodError): ActionError =>
  fail("Dados inválidos", z.flattenError(error).fieldErrors as Record<string, string[]>);
