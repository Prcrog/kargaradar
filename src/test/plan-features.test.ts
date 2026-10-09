import { describe, it, expect } from "vitest";
import { planFeatures } from "@/lib/company";
describe("planFeatures", () => {
  it("básico só cadastro manual", () => expect(planFeatures("basico")).toEqual({ whatsapp: false, team: false, excel: false }));
  it("profissional tem WhatsApp sem Excel", () => expect(planFeatures("profissional")).toEqual({ whatsapp: true, team: true, excel: false }));
  it("completo tem Excel", () => expect(planFeatures("completo").excel).toBe(true));
});
