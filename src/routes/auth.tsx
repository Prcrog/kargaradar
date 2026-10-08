import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — KargaRadar" },
      { name: "description", content: "Acesse sua transportadora ou cadastre uma empresa no KargaRadar." },
      { property: "og:title", content: "Entrar — KargaRadar" },
      { property: "og:description", content: "Acesse sua transportadora ou cadastre uma empresa no KargaRadar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error("E-mail ou senha inválidos"); return; }
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth" } });
      setLoading(false);
      if (error) {
        const message = error.code === "weak_password" || /weak|easy to guess|password.*(short|least)/i.test(error.message)
          ? "Essa senha é considerada insegura. Escolha outra, de preferência longa, com letras, números e símbolos, sem sequências comuns."
          : error.code === "over_email_send_rate_limit" || error.status === 429
            ? "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente."
            : "Não foi possível criar a conta. Confira os dados e tente novamente.";
        setFormError(message);
        toast.error(message); return;
      }
      toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      setMode("in");
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto mt-16 max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sua transportadora no KargaRadar.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2"><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="p">Senha</Label><Input id="p" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} required minLength={6} aria-describedby={mode === "up" ? "password-hint" : undefined} value={password} onChange={(e) => setPassword(e.target.value)} />{mode === "up" && <p id="password-hint" className="text-xs text-muted-foreground">Prefira uma senha longa com letras, números e símbolos. Evite nomes, datas e sequências comuns.</p>}</div>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <Button variant="ghost" className="mt-4 w-full text-sm" onClick={() => { setMode(mode === "in" ? "up" : "in"); setFormError(""); }}>
          {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tenho conta"}
        </Button>
      </div>
    </div>
  );
}
