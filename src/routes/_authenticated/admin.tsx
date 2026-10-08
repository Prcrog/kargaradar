import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, statusLabel } from "@/lib/status";
import { ImportExcel } from "@/components/ImportExcel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel de entregas — Guanabara Prime" },
      { name: "description", content: "Cadastre e atualize entregas." },
      { property: "og:title", content: "Painel de entregas — Guanabara Prime" },
      { property: "og:description", content: "Cadastre e atualize entregas." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");

  const role = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
      return !!data;
    },
  });
  const list = useQuery({
    queryKey: ["shipments"],
    enabled: role.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const rows = (list.data ?? []).filter((s) =>
    [s.tracking_code, s.nfe_number, s.customer_name, s.customer_doc].join(" ").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Entregas</h1>
          <div className="flex gap-2">
            {role.data && <ImportExcel />}
            {role.data && <ShipmentForm />}
            <Button variant="outline" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sair</Button>
          </div>
        </div>

        {role.data === false && (
          <p className="mt-8 rounded-lg border bg-card p-6 text-muted-foreground">Sua conta ainda não tem permissão de administrador. Peça ao responsável para liberar seu acesso.</p>
        )}

        {role.data && (
          <>
            <Input className="mt-6 max-w-sm" placeholder="Buscar por NF, código, cliente, CPF/CNPJ..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-muted-foreground">
                  <tr><th className="p-3">Código</th><th className="p-3">NF</th><th className="p-3">Chave NF-e</th><th className="p-3">Cliente</th><th className="p-3">Rota</th><th className="p-3">Inclusão</th><th className="p-3">Previsão</th><th className="p-3">Status</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3 font-mono">{s.tracking_code}</td>
                      <td className="p-3">{s.nfe_number}</td>
                      <td className="p-3 font-mono text-xs break-all min-w-[180px]">{s.nfe_key || "—"}</td>
                      <td className="p-3">{s.customer_name}<div className="text-xs text-muted-foreground">{s.customer_doc}</div></td>
                      <td className="p-3">{s.origin} → {s.destination}</td>
                      <td className="p-3 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3 whitespace-nowrap">{s.estimated_delivery ? new Date(s.estimated_delivery + "T12:00").toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="p-3"><Badge variant={s.status === "entregue" ? "default" : s.status === "ocorrencia" ? "destructive" : "secondary"}>{statusLabel(s.status)}</Badge></td>
                      <td className="p-3 text-right"><UpdateStatus id={s.id} current={s.status} /></td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Nenhuma entrega.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ShipmentForm() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ nfe_number: "", nfe_key: "", customer_name: "", customer_doc: "", origin: "", destination: "", estimated_delivery: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase.from("shipments").insert({ ...f, estimated_delivery: f.estimated_delivery || null }).select().single();
    if (error) { toast.error("Erro ao salvar"); return; }
    await supabase.from("shipment_events").insert({ shipment_id: data.id, status: "coletado", location: f.origin, note: "Mercadoria coletada" });
    toast.success(`Entrega criada: ${data.tracking_code}`);
    qc.invalidateQueries({ queryKey: ["shipments"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nova entrega</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova entrega</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nº da NF" v={f.nfe_number} on={set("nfe_number")} />
          <Field label="CPF/CNPJ destinatário *" v={f.customer_doc} on={set("customer_doc")} req />
          <div className="sm:col-span-2"><Field label="Chave NF-e (44 dígitos)" v={f.nfe_key} on={set("nfe_key")} /></div>
          <div className="sm:col-span-2"><Field label="Nome do destinatário *" v={f.customer_name} on={set("customer_name")} req /></div>
          <Field label="Origem *" v={f.origin} on={set("origin")} req />
          <Field label="Destino *" v={f.destination} on={set("destination")} req />
          <Field label="Previsão de entrega" v={f.estimated_delivery} on={set("estimated_delivery")} type="date" />
          <Button type="submit" className="sm:col-span-2">Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, v, on, req, type = "text" }: { label: string; v: string; on: (e: React.ChangeEvent<HTMLInputElement>) => void; req?: boolean; type?: string }) {
  return <div className="space-y-1"><Label>{label}</Label><Input type={type} value={v} onChange={on} required={req} /></div>;
}

function UpdateStatus({ id, current }: { id: string; current: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(current);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("shipment_events").insert({ shipment_id: id, status, location: location || null, note: note || null });
    if (error) { toast.error("Erro ao atualizar"); return; }
    await supabase.from("shipments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["shipments"] });
    setOpen(false); setLocation(""); setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Atualizar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Atualizar status</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <div className="space-y-1"><Label>Local</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Resende - RJ" /></div>
          <div className="space-y-1"><Label>Observação</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <Button type="submit" className="w-full">Salvar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
