import { createFileRoute } from "@tanstack/react-router";
import { Route as TrackingRoute } from "./rastrear";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KargaRadar — Consulte sua entrega" },
      { name: "description", content: "Consulte o status da sua entrega pela NF, chave NF-e ou código de rastreio." },
      { property: "og:title", content: "KargaRadar — Consulte sua entrega" },
      { property: "og:description", content: "Rastreie sua entrega pela NF, chave NF-e ou código de rastreio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const C = TrackingRoute.options.component!;
    return <C />;
  },
});
