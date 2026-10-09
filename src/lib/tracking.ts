import { supabase } from "@/integrations/supabase/client";

export type TrackingResult = {
  tracking_code: string;
  nfe_number: string | null;
  customer_name: string;
  origin: string;
  destination: string;
  status: string;
  estimated_delivery: string | null;
  updated_at: string;
  events: { status: string; location: string | null; note: string | null; created_at: string }[];
};

export type TrackingQuery =
  | { mode: "chave"; key: string }
  | { mode: "nf" | "codigo"; number: string; doc: string };

const NOT_FOUND = "Nenhuma entrega encontrada. Confira os dados informados.";
const AMBIGUOUS =
  "Encontramos mais de uma entrega com esses dados. Informe a chave de acesso da NF-e ou o código de rastreio para continuar.";

/**
 * Public lookup. The customer never says which carrier holds the cargo: the database
 * searches every approved carrier and refuses to guess when several deliveries match.
 */
export async function lookupShipment(
  query: TrackingQuery,
): Promise<{ result: TrackingResult | null; error: string }> {
  const args: { _nfe_key?: string; _number?: string; _doc?: string } =
    query.mode === "chave" ? { _nfe_key: query.key } : { _number: query.number, _doc: query.doc };

  const { data, error } = await supabase.rpc("track_public_shipment", args);
  if (error || !data) return { result: null, error: NOT_FOUND };

  const found = data as unknown as TrackingResult & { ambiguous?: boolean };
  if (found.ambiguous) return { result: null, error: AMBIGUOUS };

  return { result: found, error: "" };
}
