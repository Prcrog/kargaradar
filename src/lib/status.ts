export const STATUSES = [
  { value: "coletado", label: "Coletado" },
  { value: "em_transito", label: "Em trânsito" },
  { value: "em_rota", label: "Saiu para entrega" },
  { value: "entregue", label: "Entregue" },
  { value: "ocorrencia", label: "Ocorrência" },
] as const;

export const statusLabel = (v: string) =>
  STATUSES.find((s) => s.value === v)?.label ?? v;

export const STEPS = ["coletado", "em_transito", "em_rota", "entregue"];
