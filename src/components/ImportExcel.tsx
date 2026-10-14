import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Colunas: A CPF/CNPJ, B Nº NF, C Chave de acesso, D Origem, E Destino, F Previsão de entrega
function toDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const [, d = "", m = "", yy = ""] = br;
    const y = yy.length === 2 ? "20" + yy : yy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

export function ImportExcel() {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
      if (!sheet) { toast.error("Planilha vazia."); return; }
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
      const str = (v: unknown) => String(v ?? "").trim();
      const data = rows
        .filter((r) => r.some((c) => str(c) !== ""))
        .filter((r) => !/cpf|cnpj/i.test(str(r[0]))) // pula cabeçalho
        // A CPF/CNPJ · B Nome · C CTE · D NF · E Chave · F Origem · G Destino · H Entrega
        .map((r) => ({
          customer_doc: str(r[0]),
          customer_name: str(r[1]) || "Cliente",
          cte: str(r[2]) || null,
          nfe_number: str(r[3]) || null,
          nfe_key: str(r[4]).replace(/\D/g, "") || null,
          origin: str(r[5]),
          destination: str(r[6]),
          estimated_delivery: toDate(r[7]),
        }))
        .filter((r) => r.customer_doc && r.origin && r.destination);

      if (data.length === 0) { toast.error("Nenhuma linha válida encontrada na planilha."); return; }

      const { data: created, error } = await supabase.from("shipments").insert(data).select("id, origin");
      if (error) { toast.error("Erro ao importar: " + error.message); return; }
      await supabase.from("shipment_events").insert(
        created.map((s) => ({ shipment_id: s.id, status: "coletado", location: s.origin, note: "Mercadoria coletada" })),
      );
      toast.success(`${created.length} entrega(s) importada(s)!`);
      qc.invalidateQueries({ queryKey: ["shipments"] });
    } catch {
      toast.error("Não foi possível ler o arquivo. Use uma planilha .xlsx ou .xls.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
      <Button variant="secondary" disabled={busy} onClick={() => ref.current?.click()} title="Colunas: CPF/CNPJ · Nome do cliente · CTE · NF · Chave NF-e · Origem · Destino · Entrega">
        <FileSpreadsheet className="mr-2 h-4 w-4" />{busy ? "Importando..." : "Importar Excel"}
      </Button>
    </>
  );
}
