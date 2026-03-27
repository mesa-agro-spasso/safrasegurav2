import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  open: { label: "Aberta", variant: "default" },
  closed: { label: "Fechada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  completed: { label: "Concluído", variant: "default" },
  running: { label: "Executando", variant: "outline" },
  failed: { label: "Falhou", variant: "destructive" },
  calculated: { label: "Calculado", variant: "default" },
  pending: { label: "Pendente", variant: "outline" },
};

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status ?? "unknown";
  const cfg = statusConfig[s] ?? { label: s, variant: "outline" as const };
  return <Badge variant={cfg.variant} className={className}>{cfg.label}</Badge>;
}
