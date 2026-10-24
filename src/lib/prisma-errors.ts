import { Prisma } from "@/generated/prisma/client";

/** Violação de restrição única (ex.: SKU ou e-mail duplicado). */
export const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/** Registro não encontrado em update/delete. */
export const isNotFound = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
