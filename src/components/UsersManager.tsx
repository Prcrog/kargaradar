import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Users, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listUsers, setAdmin, deleteMember, createMember } from "@/lib/users.functions";

export function UsersManager({ companyId, label }: { companyId?: string; label?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const update = useServerFn(setAdmin);
  const remove = useServerFn(deleteMember);
  const create = useServerFn(createMember);
  const key = ["users", companyId ?? "self"];
  const q = useQuery({ queryKey: key, queryFn: () => list({ data: companyId ? { companyId } : {} }), enabled: open });

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await create({ data: { email, password, ...(companyId ? { companyId } : {}) } });
      toast.success("Usuário cadastrado e liberado");
      setEmail(""); setPassword("");
      qc.invalidateQueries({ queryKey: key });
    } catch (err) { toast.error((err as Error).message); }
    finally { setCreating(false); }
  }

  async function toggle(userId: string, admin: boolean) {
    try {
      await update({ data: companyId ? { userId, admin, companyId } : { userId, admin } });
      toast.success(admin ? "Acesso liberado" : "Usuário bloqueado");
      qc.invalidateQueries({ queryKey: key });
    } catch (e) { toast.error((e as Error).message); return; }
  }

  async function excluir(userId: string, email: string) {
    if (!window.confirm(`Excluir o acesso de ${email}? Esta ação não pode ser desfeita.`)) return;
    try {
      await remove({ data: companyId ? { userId, companyId } : { userId } });
      toast.success("Usuário excluído");
      qc.invalidateQueries({ queryKey: key });
    } catch (e) { toast.error((e as Error).message); return; }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Users className="mr-2 h-4 w-4" />{label ?? "Usuários"}</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Usuários da transportadora</DialogTitle></DialogHeader>
        <form onSubmit={criar} className="flex flex-wrap items-end gap-2 border-b pb-4">
          <div className="min-w-[180px] flex-1 space-y-1"><Label htmlFor="nu-email">E-mail</Label><Input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="min-w-[140px] flex-1 space-y-1"><Label htmlFor="nu-pass">Senha</Label><Input id="nu-pass" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button type="submit" disabled={creating}><UserPlus className="mr-2 h-4 w-4" />{creating ? "Criando..." : "Cadastrar"}</Button>
        </form>
        {q.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {q.isError && <p className="text-sm text-destructive">Não foi possível carregar a equipe. Tente novamente.</p>}
        {q.data && q.data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>}
        <div className="divide-y">
          {(q.data ?? []).map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="font-medium">{u.email}</div>
                <div className="text-xs text-muted-foreground">
                  Criado em {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  {!u.confirmed && " · e-mail não confirmado"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {u.isOwner ? <Badge variant="outline">Proprietário</Badge> : <>
                  {u.isAdmin ? <Badge>Liberado</Badge> : <Badge variant="secondary">Bloqueado</Badge>}
                  {u.isAdmin
                    ? <Button size="sm" variant="outline" onClick={() => toggle(u.id, false)}>Bloquear</Button>
                    : <Button size="sm" onClick={() => toggle(u.id, true)}>Liberar</Button>}
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => excluir(u.id, u.email)} title="Excluir usuário" aria-label={`Excluir ${u.email}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
