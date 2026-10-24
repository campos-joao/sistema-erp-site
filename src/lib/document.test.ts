import { describe, expect, it } from "vitest";

import { formatDocument, isValidCnpj, isValidCpf, isValidDocument, normalizeDocument } from "@/lib/document";

describe("CPF", () => {
  it("aceita CPF válido com ou sem pontuação", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejeita dígitos verificadores errados e sequências repetidas", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});

describe("CNPJ", () => {
  it("aceita CNPJ numérico válido", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("aceita CNPJ alfanumérico válido (exemplo oficial da Receita)", () => {
    expect(isValidCnpj("12.ABC.345/01DE-35")).toBe(true);
    expect(isValidCnpj("12abc34501de35")).toBe(true);
  });

  it("rejeita CNPJ inválido", () => {
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(isValidCnpj("12.ABC.345/01DE-36")).toBe(false);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
    expect(isValidCnpj("12.ABC.345/01DE-3A")).toBe(false);
  });
});

describe("helpers", () => {
  it("decide entre CPF e CNPJ pelo tamanho", () => {
    expect(isValidDocument("529.982.247-25")).toBe(true);
    expect(isValidDocument("11.222.333/0001-81")).toBe(true);
    expect(isValidDocument("1234")).toBe(false);
  });

  it("normaliza e formata", () => {
    expect(normalizeDocument("12.abc.345/01de-35")).toBe("12ABC34501DE35");
    expect(formatDocument("12ABC34501DE35")).toBe("12.ABC.345/01DE-35");
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
    expect(formatDocument(null)).toBe("");
  });
});
