import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, Circle, MapPin, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STEPS, statusLabel } from "@/lib/status";
import { maskCpfCnpj } from "@/lib/utils";
import { lookupShipment, type TrackingResult } from "@/lib/tracking";
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

function TrackingPage() {
  const [mode, setMode] = useState("nf");
  const [number, setNumber] = useState("");
  const [doc, setDoc] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    const query = mode === "chave"
      ? { mode: "chave" as const, key }
      : { mode: (mode === "nf" ? "nf" : "codigo") as "nf" | "codigo", number, doc };
    const found = await lookupShipment(query);
    setLoading(false);
    if (found.result) setResult(found.result);
    else setError(found.error);
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <img src={hero} alt="Caminhão de cargas na estrada" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <Header dark />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-32 text-navy-foreground">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Rastreamento</p>
          <h1 className="mt-3 max-w-xl text-4xl font-extrabold md:text-6xl">A ansiedade tá grande? A gente entende.</h1>
          <p className="mt-4 max-w-md opacity-80">Faça a consulta rápida pela NF-e, CT-e, Chave da NF-e, Código de rastreio.</p>

          <form onSubmit={search} className="mt-8 max-w-2xl rounded-lg bg-card p-6 text-card-foreground shadow-2xl">
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="nf">Nº da NF</TabsTrigger>
                <TabsTrigger value="cte">CT-e</TabsTrigger>
                <TabsTrigger value="chave">Chave NF-e</TabsTrigger>
                <TabsTrigger value="codigo">Cód. rastreio</TabsTrigger>
              </TabsList>
              <TabsContent value="chave" className="mt-4 space-y-2">
                <Label htmlFor="key">Chave de acesso (44 dígitos)</Label>
                <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="0000 0000 0000 ..." inputMode="numeric" />
              </TabsContent>
              {mode !== "chave" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="num">{mode === "nf" ? "Número da nota fiscal" : mode === "cte" ? "Número do CT-e" : "Código de rastreio"}</Label>
                    <Input id="num" value={number} onChange={(e) => setNumber(e.target.value)} placeholder={mode === "codigo" ? "Ex: GP12345678" : "Ex: 123"} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc">CNPJ ou CPF do destinatário</Label>
                    <Input
                      id="doc"
                      value={doc}
                      onChange={(e) => setDoc(maskCpfCnpj(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}
            </Tabs>
            <Button type="submit" size="lg" className="mt-5 w-full font-semibold" disabled={loading}><Search className="mr-2 h-4 w-4" /> {loading ? "Buscando..." : "Rastrear entrega"}</Button>
          </form>
        </div>
        <ProcionBadge />
      </section>
      <main className="mx-auto max-w-3xl px-6 pt-12 pb-28">
        {error && <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"><AlertTriangle className="h-5 w-5" /> {error}</div>}
        {result && <ResultCard r={result} />}
      </main>
    </div>
  );
}

function ResultCard({ r }: { r: TrackingResult }) {
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
