import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));

import { lookupShipment } from "@/lib/tracking";

const shipment = {
  tracking_code: "GP12345678",
  nfe_number: "000123",
  customer_name: "Cliente",
  origin: "Rio de Janeiro - RJ",
  destination: "São Paulo - SP",
  status: "em_transito",
  estimated_delivery: "2026-10-11",
  updated_at: "2026-10-09T10:00:00Z",
  events: [],
};

describe("Consulta pública de entregas", () => {
  beforeEach(() => rpc.mockReset());

  it("busca pela NF sem informar a transportadora", async () => {
    rpc.mockResolvedValue({ data: shipment, error: null });

    const out = await lookupShipment({ mode: "nf", number: "123", doc: "123.456.789-09" });

    expect(rpc).toHaveBeenCalledWith("track_public_shipment", { _number: "123", _doc: "123.456.789-09" });
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty("_company_slug");
    expect(out.result?.tracking_code).toBe("GP12345678");
  });

  it("busca pela chave de acesso da NF-e", async () => {
    rpc.mockResolvedValue({ data: shipment, error: null });

    await lookupShipment({ mode: "chave", key: "33261012345678000190550010000001231000001234" });

    expect(rpc).toHaveBeenCalledWith("track_public_shipment", {
      _nfe_key: "33261012345678000190550010000001231000001234",
    });
  });

  it("não escolhe uma entrega quando mais de uma corresponde aos dados", async () => {
    rpc.mockResolvedValue({ data: { ambiguous: true }, error: null });

    const out = await lookupShipment({ mode: "codigo", number: "GP12345678", doc: "123.456.789-09" });

    expect(out.result).toBeNull();
    expect(out.error).toContain("chave");
  });
});
