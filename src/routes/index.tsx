import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, FileSpreadsheet, MessageCircle, PackageCheck, Radar, Route as RouteIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import hero from "@/assets/kargaradar-truck.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KargaRadar — Rastreamento para transportadoras" },
      { name: "description", content: "Cadastre entregas, compartilhe atualizações pelo WhatsApp e ofereça rastreamento aos seus clientes." },
      { property: "og:title", content: "KargaRadar — Rastreamento para transportadoras" },
      { property: "og:description", content: "Gestão simples de entregas e rastreamento para transportadoras de todos os tamanhos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[88vh] overflow-hidden">
        <img src={hero} alt="Caminhão de cargas na estrada" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <Header dark />
        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl items-center px-6 pb-16 pt-28 text-navy-foreground">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Gestão de entregas sem complicação</p>
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl md:text-6xl">KargaRadar</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed opacity-90 md:text-xl">Sua transportadora organizada e seus clientes informados, do cadastro da carga até a entrega.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/auth">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="secondary"><Link to="/rastrear"><Radar className="mr-2 h-4 w-4" /> Rastrear entrega</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Como funciona</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">Da sua operação para a tela do cliente</h2><p className="mt-4 text-muted-foreground">Um processo direto para reduzir mensagens repetidas e dar visibilidade a cada entrega.</p></div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step icon={PackageCheck} number="01" title="Cadastre as cargas" text="Inclua cada entrega manualmente ou importe sua planilha no plano Completo." />
            <Step icon={RouteIcon} number="02" title="Atualize o percurso" text="Registre coleta, trânsito, ocorrências e entrega em poucos cliques." />
            <Step icon={MessageCircle} number="03" title="Mantenha o cliente informado" text="Compartilhe o status pelo WhatsApp e ofereça consulta online a qualquer momento." />
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Planos</p><h2 className="mt-3 text-3xl font-bold md:text-4xl">Escolha o pacote ideal</h2><p className="mx-auto mt-4 max-w-xl text-muted-foreground">Comece com o essencial e evolua conforme sua operação cresce.</p></div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <Plan name="Básico" price="49,90" description="Para começar a organizar suas entregas." features={["Cadastro manual de entregas", "Página de rastreamento para clientes", "Atualização de status"]} />
            <Plan name="Profissional" price="69,90" description="Para atender seus clientes com agilidade." featured features={["Tudo do plano Básico", "Envio de status pelo WhatsApp", "Gestão da equipe"]} />
            <Plan name="Completo" price="89,90" description="Para operações com maior volume de cargas." features={["Tudo do plano Profissional", "Importação de planilhas Excel", "Exportação de entregas em Excel"]} />
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">Valores mensais. A contratação é concluída após a aprovação do cadastro da transportadora.</p>
        </div>
      </section>

      <section className="bg-navy py-16 text-navy-foreground"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center"><div><h2 className="text-3xl font-bold">Pronto para modernizar seus rastreios?</h2><p className="mt-2 opacity-75">Crie sua conta e cadastre sua transportadora.</p></div><Button asChild size="lg"><Link to="/auth">Criar conta <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></section>
    </article>
  );
}

function Step({ icon: Icon, number, title, text }: { icon: typeof PackageCheck; number: string; title: string; text: string }) {
  return (
    <div className="border-t-2 border-primary pt-6"><div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span><span className="font-display text-2xl font-bold text-muted-foreground/40">{number}</span></div><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 leading-relaxed text-muted-foreground">{text}</p></div>
  );
}

function Plan({ name, price, description, features, featured = false }: { name: string; price: string; description: string; features: string[]; featured?: boolean }) {
  return (
    <article className={`relative flex flex-col rounded-lg border bg-card p-7 ${featured ? "border-primary shadow-lg" : "shadow-sm"}`}>
      {featured && <span className="absolute right-5 top-5 rounded-md bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">Mais escolhido</span>}
      <h3 className="text-xl font-bold">{name}</h3><p className="mt-2 min-h-12 text-sm text-muted-foreground">{description}</p>
      <p className="mt-6"><span className="text-sm font-semibold">R$</span> <span className="font-display text-4xl font-extrabold">{price}</span><span className="text-sm text-muted-foreground">/mês</span></p>
      <ul className="mt-7 flex-1 space-y-3">{features.map(feature => <li key={feature} className="flex gap-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{feature}</li>)}</ul>
      <Button asChild className="mt-8" variant={featured ? "default" : "outline"}><Link to="/auth">Escolher {name}</Link></Button>
    </div>
  );
}
