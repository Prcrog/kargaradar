import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listUsers, setAdmin, deleteMember } from "@/lib/users.functions";

export function UsersManager({ companyId, label }: { companyId?: string; label?: string } = {}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const update = useServerFn(setAdmin);
  const remove = useServerFn(deleteMember);
  const key = ["users", companyId ?? "self"];
  const q = useQuery({ queryKey: key, queryFn: () => list({ data: { companyId } }), enabled: open });

  async function toggle(userId: string, admin: boolean) {
    try {
      await update({ data: { userId, admin, companyId } });
      toast.success(admin ? "Acesso liberado" : "Usuário bloqueado");
      qc.invalidateQueries({ queryKey: key });
    } catch (e) { toast.error((e as Error).message); return; }
  }

  async function excluir(userId: string, email: string) {
    if (!window.confirm(`Excluir o acesso de ${email}? Esta ação não pode ser desfeita.`)) return;
    try {
      await remove({ data: { userId, companyId } });
      toast.success("Usuário excluído");
      qc.invalidateQueries({ queryKey: key });
    } catch (e) { toast.error((e as Error).message); return; }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Users className="mr-2 h-4 w-4" />{label ?? "Usuários"}</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Usuários da transportadora</DialogTitle></DialogHeader>
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
