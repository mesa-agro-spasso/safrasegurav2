import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: Record<string, unknown> | null;
}

const MAIN_FIELDS = [
  "commodity", "display_name", "warehouse", "ticker", "maturity",
  "volume", "futures_price", "exchange_rate", "gross_price_brl",
  "origination_price_brl", "purchased_basis_brl", "breakeven_basis_brl",
  "insurance_strategy", "insurance_premium_brl", "insurance_strike",
  "payment_date", "sale_date", "operation_date", "broker", "account", "status", "legs",
];

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number") return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  return String(val);
}

export default function OperationDetail({ open, onOpenChange, operation }: Props) {
  if (!operation) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm">
            {String(operation.display_name || "Operação")}
            <Badge variant="outline" className="ml-2 text-xs">{String(operation.status ?? "open")}</Badge>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {MAIN_FIELDS.map((f) => (
              <div key={f} className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase">{f}</p>
                <p className="text-xs font-mono">{formatValue(operation[f])}</p>
              </div>
            ))}
          </div>

          {operation.notes && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">Observações</p>
              <p className="text-xs">{String(operation.notes)}</p>
            </div>
          )}

          {operation.costs_snapshot && typeof operation.costs_snapshot === "object" && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">Costs Snapshot</p>
              <pre className="text-[10px] font-mono bg-muted p-2 rounded-md whitespace-pre-wrap break-all">
                {JSON.stringify(operation.costs_snapshot, null, 2)}
              </pre>
            </div>
          )}

          {operation.pricing_snapshot && typeof operation.pricing_snapshot === "object" && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase">Pricing Snapshot</p>
              <pre className="text-[10px] font-mono bg-muted p-2 rounded-md whitespace-pre-wrap break-all">
                {JSON.stringify(operation.pricing_snapshot, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
