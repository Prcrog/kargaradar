import { describe, expect, it } from "vitest";

import { maskCpfCnpj } from "@/lib/utils";

describe("Máscara CPF/CNPJ do campo de busca", () => {
  it("deixa 11 dígitos no formato de CPF", () => {
    expect(maskCpfCnpj("12345678909")).toBe("123.456.789-09");
  });

  it("deixa 14 dígitos no formato de CNPJ", () => {
    expect(maskCpfCnpj("12345678901234")).toBe("12.345.678/9012-34");
  });

  it("acompanha a digitação: um CPF digitado dígito a dígito vira CNPJ sem quebrar", () => {
    let field = "";
    for (const digit of "12345678901234") field = maskCpfCnpj(field + digit);
    expect(field).toBe("12.345.678/9012-34");
  });

  it("ignora letras e para no 14º dígito", () => {
    expect(maskCpfCnpj("12.345.678/9012-34abc")).toBe("12.345.678/9012-34");
    expect(maskCpfCnpj("1234567890123499")).toBe("12.345.678/9012-34");
  });
});
