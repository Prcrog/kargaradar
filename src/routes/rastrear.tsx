import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Calendar, CheckCircle2, Circle, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STEPS, statusLabel } from "@/lib/status";
import hero from "@/assets/kargaradar-truck.jpg";

export const Route = createFileRoute("/rastrear")({
  head: () => ({
    meta: [
      { title: "Rastrear entrega — KargaRadar" },
      { name: "description", content: "Consulte o status da sua entrega pela NF-e, chave de acesso ou código de rastreio." },
      { property: "og:title", content: "Rastrear entrega — KargaRadar" },
      { property: "og:description", content: "Consulte o status da sua entrega pela NF-e, chave de acesso ou código de rastreio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackingPage,
});

type Result = {
  tracking_code: string; nfe_number: string | null; customer_name: string;
  origin: string; destination: string; status: string;
  estimated_delivery: string | null; updated_at: string;
  events: { status: string; location: string | null; note: string | null; created_at: string }[];
};

function TrackingPage() {
  const [company, setCompany] = useState("");
  const companies = useQuery({ queryKey: ["trackingCompanies"], queryFn: async () => {
    const { data, error } = await supabase.rpc("tracking_companies");
    if (error) throw error; return data;
  } });
  const [mode, setMode] = useState("nf");
  const [number, setNumber] = useState("");
  const [doc, setDoc] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    const args = mode === "chave" ? { _nfe_key: key } : { _number: number, _doc: doc };
    const { data, error: searchError } = await supabase.rpc("track_company_shipment", { ...args, _company_slug: company });
    setLoading(false);
    if (searchError || !data) { setError("Nenhuma entrega encontrada. Confira os dados informados."); return; }
    setResult(data as unknown as Result);
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <img src={hero} alt="Caminhão de cargas na estrada" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <Header dark />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-32 text-navy-foreground">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Rastreamento</p>
          <h1 className="mt-3 max-w-xl text-4xl font-extrabold md:text-6xl">Encontre sua entrega</h1>
          <p className="mt-4 max-w-md opacity-80">Consulte em tempo real pela nota fiscal, chave de acesso da NF-e ou código de rastreio.</p>

          <form onSubmit={search} className="mt-8 max-w-2xl rounded-lg bg-card p-6 text-card-foreground shadow-2xl">
            <div className="mb-4 space-y-2"><Label htmlFor="tracking-company">Transportadora</Label><Select required value={company} onValueChange={value => { setCompany(value); setResult(null); setError(""); }}><SelectTrigger id="tracking-company" className="w-full"><SelectValue placeholder={companies.isLoading ? "Carregando..." : "Selecione a transportadora"} /></SelectTrigger><SelectContent>{companies.data?.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent></Select>{companies.isError && <p className="text-sm text-destructive">Não foi possível carregar as transportadoras.</p>}</div>
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="nf">Nº da NF</TabsTrigger>
                <TabsTrigger value="chave">Chave NF-e</TabsTrigger>
                <TabsTrigger value="codigo">Cód. rastreio</TabsTrigger>
              </TabsList>
              <TabsContent value="chave" className="mt-4 space-y-2">
                <Label htmlFor="key">Chave de acesso (44 dígitos)</Label>
                <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="0000 0000 0000 ..." inputMode="numeric" />
              </TabsContent>
              {mode !== "chave" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="num">{mode === "nf" ? "Número da nota fiscal" : "Código de rastreio"}</Label><Input id="num" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={mode === "nf" ? "Ex: 123" : "Ex: GP12345678"} /></div>
                  <div className="space-y-2"><Label htmlFor="doc">CPF ou CNPJ do destinatário</Label><Input id="doc" value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="000.000.000-00" /></div>
                </div>
              )}
            </Tabs>
            <Button type="submit" size="lg" className="mt-5 w-full font-semibold" disabled={loading}><Search className="mr-2 h-4 w-4" /> {loading ? "Buscando..." : "Rastrear entrega"}</Button>
          </form>
        </div>
      </section>
      <main className="mx-auto max-w-3xl px-6 py-12">
        {error && <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"><AlertTriangle className="h-5 w-5" /> {error}</div>}
        {result && <ResultCard r={result} />}
      </main>
    </div>
  );
}

function ResultCard({ r }: { r: Result }) {
  const idx = STEPS.indexOf(r.status);
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Código {r.tracking_code}{r.nfe_number && ` · NF ${r.nfe_number}`}</p><h2 className="mt-1 text-2xl font-bold">{statusLabel(r.status)}</h2><p className="text-sm text-muted-foreground">Olá, {r.customer_name}</p></div>
        {r.estimated_delivery && <div className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground"><Calendar className="h-4 w-4" /> Previsão: {new Date(r.estimated_delivery + "T12:00").toLocaleDateString("pt-BR")}</div>}
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" /> {r.origin} <span className="text-muted-foreground">→</span> {r.destination}</div>
      <div className="mt-6 grid grid-cols-4 gap-2">{STEPS.map((s, i) => <div key={s}><div className={`h-2 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} /><p className={`mt-2 text-xs ${i <= idx ? "font-semibold" : "text-muted-foreground"}`}>{statusLabel(s)}</p></div>)}</div>
      <h3 className="mt-8 font-semibold">Histórico</h3>
      <ol className="mt-4 space-y-4">{r.events.map((event, i) => <li key={`${event.created_at}-${i}`} className="flex gap-3">{i === 0 ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}<div><p className="font-medium">{statusLabel(event.status)}{event.location && ` — ${event.location}`}</p>{event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}<p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString("pt-BR")}</p></div></li>)}</ol>
    </div>
  );
}