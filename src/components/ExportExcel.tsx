import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { statusLabel } from "@/lib/status";

type Shipment = {
  tracking_code: string;
  nfe_number: string | null;
  nfe_key: string | null;
  customer_name: string;
  customer_doc: string;
  origin: string;
  destination: string;
  status: string;
  estimated_delivery: string | null;
  created_at: string;
};

export function ExportExcel({ rows, filter }: { rows: Shipment[]; filter: string }) {
  function exportar() {
    if (rows.length === 0) {
      toast.error("Nenhuma entrega para exportar com o filtro atual.");
      return;
    }
    const data = rows.map((s) => ({
      "Código de rastreio": s.tracking_code,
      "Nº NF": s.nfe_number ?? "",
      "Chave NF-e": s.nfe_key ?? "",
      Cliente: s.customer_name,
      "CPF/CNPJ": s.customer_doc,
      Origem: s.origin,
      Destino: s.destination,
      Inclusão: new Date(s.created_at).toLocaleDateString("pt-BR"),
      "Previsão de entrega": s.estimated_delivery
        ? new Date(s.estimated_delivery + "T12:00").toLocaleDateString("pt-BR")
        : "",
      Status: statusLabel(s.status),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 48 }, { wch: 30 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rastreamentos");
    const sufixo = filter.trim() ? "-filtrado" : "";
    XLSX.writeFile(wb, `rastreamentos${sufixo}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`${rows.length} entrega(s) exportada(s) com os códigos de rastreio.`);
  }

  return (
    <Button variant="outline" onClick={exportar} title="Exporta a lista filtrada com os códigos de rastreio">
      <Download className="mr-2 h-4 w-4" />Exportar
    </Button>
  );
}
