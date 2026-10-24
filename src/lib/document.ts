/**
 * Validação de CPF e CNPJ (incluindo o CNPJ alfanumérico, vigente desde 07/2026).
 * Documentos são armazenados normalizados: sem pontuação e em maiúsculas.
 */

export const normalizeDocument = (value: string) => value.replace(/[.\-/\s]/g, "").toUpperCase();

const allSameChar = (value: string) => /^(.)\1*$/.test(value);

export function isValidCpf(value: string) {
  const cpf = normalizeDocument(value);
  if (!/^\d{11}$/.test(cpf) || allSameChar(cpf)) return false;

  const digit = (length: number) => {
    const sum = [...cpf.slice(0, length)].reduce((acc, char, i) => acc + Number(char) * (length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeDocument(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || allSameChar(cnpj)) return false;

  // No CNPJ alfanumérico cada caractere vale (código ASCII - 48): '0'..'9' => 0..9, 'A' => 17...
  const values = [...cnpj].map((char) => char.charCodeAt(0) - 48);

  const digit = (length: number) => {
    const sum = values.slice(0, length).reduce((acc, v, i) => acc + v * (((length - 1 - i) % 8) + 2), 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return digit(12) === values[12] && digit(13) === values[13];
}

export const isValidDocument = (value: string) => {
  const doc = normalizeDocument(value);
  return doc.length === 11 ? isValidCpf(doc) : isValidCnpj(doc);
};

export function formatDocument(value: string | null | undefined) {
  if (!value) return "";
  const doc = normalizeDocument(value);
  if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (doc.length === 14) return doc.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, "$1.$2.$3/$4-$5");
  return doc;
}
