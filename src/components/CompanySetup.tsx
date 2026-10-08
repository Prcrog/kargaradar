import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function CompanySetup() {
  const qc = useQueryClient();
  const [joining, setJoining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [slug, setSlug] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const { error } = joining
        ? await supabase.rpc("join_company", { _slug: slug })
        : await supabase.rpc("register_company", { _name: name, _cnpj: cnpj, _slug: slug });
      if (error) throw error;
      toast.success("Cadastro enviado para aprovação");
      await qc.invalidateQueries({ queryKey: ["companyAccess"] });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="mt-8 max-w-lg">
    <h2 className="text-xl font-bold">{joining ? "Entrar na equipe" : "Cadastrar transportadora"}</h2>
    <form onSubmit={submit} className="mt-5 space-y-4">
      {!joining && <><div className="space-y-2"><Label htmlFor="company-name">Razão social</Label><Input id="company-name" value={name} onChange={e => setName(e.target.value)} required minLength={3} /></div><div className="space-y-2"><Label htmlFor="company-cnpj">CNPJ</Label><Input id="company-cnpj" value={cnpj} onChange={e => setCnpj(e.target.value)} required inputMode="numeric" /></div></>}
      <div className="space-y-2"><Label htmlFor="company-slug">Identificador da transportadora</Label><Input id="company-slug" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} required pattern="[a-z0-9][a-z0-9-]{2,59}" placeholder="minha-transportadora" /></div>
      <Button disabled={busy} type="submit">{busy ? "Enviando..." : joining ? "Solicitar acesso à equipe" : "Enviar cadastro"}</Button>
    </form>
    <Button variant="link" className="mt-3 px-0" onClick={() => setJoining(!joining)}>{joining ? "Cadastrar uma nova transportadora" : "Já faço parte de uma transportadora"}</Button>
  </section>;
}

export function PlatformCompanies() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["platformCompanies"], queryFn: async () => {
    const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
  async function change(id: string, status: string) {
    setBusyId(id);
    const { error } = await supabase.rpc("set_company_status", { _id: id, _status: status });
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Transportadora aprovada" : "Transportadora suspensa");
    qc.invalidateQueries();
  }
  return <section className="mt-8 border-t pt-6">
    <h2 className="text-xl font-bold">Administração KargaRadar</h2>
    <h3 className="mt-4 font-semibold">Transportadoras</h3>
    {q.isLoading && <p className="mt-3 text-muted-foreground">Carregando...</p>}
    {q.isError && <p className="mt-3 text-destructive">Não foi possível carregar as transportadoras.</p>}
    <div className="mt-3 divide-y">{q.data?.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div><p className="font-semibold">{c.name}</p><p className="text-sm text-muted-foreground">{c.cnpj || "Cadastro anterior"} · {c.slug}</p></div>
      <div className="flex items-center gap-3"><Badge variant={c.status === "approved" ? "default" : "secondary"}>{c.status === "approved" ? "Aprovada" : c.status === "pending" ? "Pendente" : "Suspensa"}</Badge>
      <Button variant="outline" disabled={busyId === c.id} onClick={() => change(c.id, c.status === "approved" ? "suspended" : "approved")}>{c.status === "approved" ? "Suspender" : "Aprovar"}</Button></div>
    </div>)}</div>
  </section>;
}