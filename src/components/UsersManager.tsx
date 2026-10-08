import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listUsers, setAdmin } from "@/lib/users.functions";

export function UsersManager() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const update = useServerFn(setAdmin);
  const q = useQuery({ queryKey: ["users"], queryFn: () => list(), enabled: open });

  async function toggle(userId: string, admin: boolean) {
    try {
      await update({ data: { userId, admin } });
      toast.success(admin ? "Acesso liberado" : "Acesso removido");
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e) {
      toast.error((e as Error).message); return;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Users className="mr-2 h-4 w-4" />Usuários</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Liberar acesso de usuários</DialogTitle></DialogHeader>
        {q.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
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
                {u.isAdmin ? <Badge>Liberado</Badge> : <Badge variant="secondary">Pendente</Badge>}
                {u.isAdmin
                  ? <Button size="sm" variant="outline" onClick={() => toggle(u.id, false)}>Remover</Button>
                  : <Button size="sm" onClick={() => toggle(u.id, true)}>Liberar</Button>}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
