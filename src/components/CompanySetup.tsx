import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLAN_LABELS: Record<string, string> = { basico: "Básico", profissional: "Profissional", completo: "Completo" };

function toSlug(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").slice(0, 60);
}

function friendlyError(msg: string) {
  if (/companies_slug|slug_key/i.test(msg)) return "Esse identificador já está em uso. Escolha outro (ex.: nome-da-empresa-rj).";
  if (/slug_check|check constraint/i.test(msg)) return "O identificador deve ter pelo menos 3 caracteres, só letras minúsculas, números e hífen.";
  if (/CNPJ/i.test(msg)) return "Informe a razão social e um CNPJ com 14 números.";
  if (/vinculada|company_roles|duplicate/i.test(msg)) return "Esta conta já está ligada a uma transportadora.";
  if (/não encontrada/i.test(msg)) return "Transportadora não encontrada ou ainda não aprovada. Confira o identificador com o responsável.";
  return "Não foi possível enviar o cadastro. Confira os dados e tente novamente.";
}

export function CompanySetup() {
  const qc = useQueryClient();
  const [joining, setJoining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setFormError(null);
    const finalSlug = toSlug(slug).replace(/-+$/, "");
    if (!joining) {
      if (name.trim().length < 3) { setFormError("Informe a razão social."); return; }
      if (cnpj.replace(/\D/g, "").length !== 14) { setFormError("O CNPJ precisa ter 14 números."); return; }
    }
    if (finalSlug.length < 3) { setFormError("O identificador precisa ter pelo menos 3 caracteres."); return; }
    setBusy(true);
    try {
      const { error } = joining
        ? await supabase.rpc("join_company", { _slug: finalSlug })
        : await supabase.rpc("register_company", { _name: name, _cnpj: cnpj, _slug: finalSlug });
      if (error) throw error;
      toast.success(joining ? "Pedido de acesso enviado" : "Cadastro enviado para aprovação");
      await qc.invalidateQueries({ queryKey: ["companyAccess"] });
    } catch (e) {
      const m = friendlyError((e as Error).message ?? "");
      setFormError(m); toast.error(m);
    } finally { setBusy(false); }
  }
  return <section className="mt-8 max-w-lg">
    <h2 className="text-xl font-bold">{joining ? "Entrar na equipe" : "Cadastrar transportadora"}</h2>
    <form onSubmit={submit} noValidate className="mt-5 space-y-4">
      {!joining && <><div className="space-y-2"><Label htmlFor="company-name">Razão social</Label><Input id="company-name" value={name} onChange={e => { setName(e.target.value); if (!slugTouched) setSlug(toSlug(e.target.value)); }} required /></div><div className="space-y-2"><Label htmlFor="company-cnpj">CNPJ</Label><Input id="company-cnpj" value={cnpj} onChange={e => setCnpj(e.target.value)} required inputMode="numeric" placeholder="00.000.000/0000-00" /></div></>}
      <div className="space-y-2"><Label htmlFor="company-slug">Identificador da transportadora</Label><Input id="company-slug" value={slug} onChange={e => { setSlugTouched(true); setSlug(toSlug(e.target.value)); }} required placeholder="minha-transportadora" /><p className="text-xs text-muted-foreground">{joining ? "Peça esse identificador ao responsável da sua transportadora." : "Nome curto usado pelos seus clientes no rastreio. Só letras minúsculas, números e hífen."}</p></div>
      {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
      <Button disabled={busy} type="submit">{busy ? "Enviando..." : joining ? "Solicitar acesso à equipe" : "Enviar cadastro"}</Button>
    </form>
    <Button variant="link" className="mt-3 px-0" onClick={() => { setJoining(!joining); setFormError(null); }}>{joining ? "Cadastrar uma nova transportadora" : "Já faço parte de uma transportadora"}</Button>
  </section>;
}

export function PlatformCompanies() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const removeCompany = useServerFn(deleteCompanyFn);
  const q = useQuery({ queryKey: ["platformCompanies"], queryFn: async () => {
    const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
  async function change(id: string, status: string) {
    setBusyId(id);
    const { error } = await supabase.rpc("set_company_status", { _id: id, _status: status });
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Transportadora liberada" : "Transportadora bloqueada");
    qc.invalidateQueries({ queryKey: ["platformCompanies"] });
  }
  async function excluir(id: string, name: string) {
    if (!window.confirm(`Excluir a transportadora ${name} e todos os seus dados? Esta ação não pode ser desfeita.`)) return;
    setBusyId(id);
    try { await removeCompany({ data: { companyId: id } }); toast.success("Transportadora excluída"); qc.invalidateQueries({ queryKey: ["platformCompanies"] }); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusyId(null); }
  }
  return <section className="mt-8 border-t pt-6">
    <h2 className="text-xl font-bold">Administração KargaRadar</h2>
    <h3 className="mt-4 font-semibold">Transportadoras</h3>
    {q.isLoading && <p className="mt-3 text-muted-foreground">Carregando...</p>}
    {q.isError && <p className="mt-3 text-destructive">Não foi possível carregar as transportadoras.</p>}
    <div className="mt-3 divide-y">{q.data?.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div><p className="font-semibold">{c.name}</p><p className="text-sm text-muted-foreground">{c.cnpj || "Cadastro anterior"} · {c.slug}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={c.status === "approved" ? "default" : c.status === "suspended" ? "destructive" : "secondary"}>{c.status === "approved" ? "Liberada" : c.status === "pending" ? "Pendente" : "Bloqueada"}</Badge>
        <UsersManager companyId={c.id} label="Usuários" />
        <Button variant="outline" disabled={busyId === c.id} onClick={() => change(c.id, c.status === "approved" ? "suspended" : "approved")}>{c.status === "approved" ? "Bloquear" : "Liberar"}</Button>
        <Button variant="outline" className="text-destructive" disabled={busyId === c.id} onClick={() => excluir(c.id, c.name)} title="Excluir transportadora" aria-label={`Excluir ${c.name}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>)}</div>
  </section>;
}