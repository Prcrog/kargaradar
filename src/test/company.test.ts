import { describe, expect, it } from "vitest";
import { canUseCompany } from "@/lib/company";
describe("Acesso das transportadoras", () => {
  it("exige aprovação da empresa", () => {
    expect(canUseCompany({ companyId: "empresa-a", approved: true, status: "pending" })).toBe(false);
  });
  it("exige liberação do membro", () => {
    expect(canUseCompany({ companyId: "empresa-a", approved: false, status: "approved" })).toBe(false);
  });
  it("libera empresa e membro aprovados", () => {
    expect(canUseCompany({ companyId: "empresa-a", approved: true, status: "approved" })).toBe(true);
  });
  it("bloqueia empresa suspensa", () => {
    expect(canUseCompany({ companyId: "empresa-a", approved: true, status: "suspended" })).toBe(false);
  });
});