import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Eye, Loader2 } from "lucide-react";
import SnapshotViewer from "./SnapshotViewer";
import { promoteItem, type PromoteToOperationResponse } from "@/lib/services/pricing-engine";
import { toast } from "sonner";

interface Props {
  items: Record<string, unknown>[];
  onPromoted: () => void;
}

const DISPLAY_COLS = [
  { key: "item_index", label: "#" },
  { key: "combination_name", label: "Combination" },
  { key: "commodity", label: "Commodity" },
  { key: "warehouse", label: "Warehouse" },
  { key: "ticker", label: "Ticker" },
  { key: "maturity", label: "Maturity" },
  { key: "volume", label: "Volume", numeric: true },
  { key: "futures_price", label: "Futures", numeric: true },
  { key: "exchange_rate", label: "FX", numeric: true },
  { key: "gross_price_brl", label: "Gross BRL", numeric: true },
  { key: "origination_price_brl", label: "Orig. Price", numeric: true },
  { key: "target_basis_brl", label: "Target Basis", numeric: true },
  { key: "purchased_basis_brl", label: "Purch. Basis", numeric: true },
  { key: "breakeven_basis_brl", label: "BE Basis", numeric: true },
  { key: "insurance_strategy", label: "Insurance" },
  { key: "insurance_premium_brl", label: "Ins. Prêmio", numeric: true },
  { key: "insurance_cost_brl", label: "Ins. Custo", numeric: true },
  { key: "status", label: "Status" },
];

function fmtNum(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  return String(v);
}

export default function RunItemsTable({ items, onPromoted }: Props) {
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [snapshotItem, setSnapshotItem] = useState<Record<string, unknown> | null>(null);

  const handlePromote = async (itemId: string) => {
    setPromotingId(itemId);
    try {
      const result: PromoteToOperationResponse = await promoteItem(itemId);
      if (result.success) {
        if (result.already_promoted) {
          toast.info("Esta operação já havia sido criada anteriormente.");
        } else {
          toast.success("Operação criada com sucesso!");
        }
        onPromoted();
      } else {
        toast.error("Erro ao promover: " + (result.error ?? "Erro desconhecido"));
      }
    } catch (err: unknown) {
      toast.error("Erro ao promover: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPromotingId(null);
    }
  };

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-8">Selecione um run para ver os itens.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {DISPLAY_COLS.map((c) => (
                <TableHead key={c.key} className={`text-xs whitespace-nowrap ${c.numeric ? "text-right" : ""}`}>{c.label}</TableHead>
              ))}
              <TableHead className="text-xs text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const id = String(item.id);
              const promoted = item.is_promoted_to_operation === true;
              return (
                <TableRow key={id}>
                  {DISPLAY_COLS.map((c) => (
                    <TableCell key={c.key} className={`text-xs font-mono ${c.numeric ? "text-right" : ""}`}>
                      {c.numeric ? fmtNum(item[c.key]) : (item[c.key] != null ? String(item[c.key]) : "—")}
                    </TableCell>
                  ))}
                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSnapshotItem(item)}>
                      <Eye className="h-3 w-3 mr-1" /> Snapshots
                    </Button>
                    {promoted ? (
                      <Badge variant="secondary" className="text-[10px]">Operação criada</Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="h-6 text-xs px-2"
                        disabled={promotingId === id}
                        onClick={() => handlePromote(id)}
                      >
                        {promotingId === id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                        Promover
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <SnapshotViewer
        open={!!snapshotItem}
        onOpenChange={(o) => !o && setSnapshotItem(null)}
        inputSnapshot={snapshotItem?.input_snapshot}
        resultSnapshot={snapshotItem?.result_snapshot}
        title={snapshotItem ? String(snapshotItem.combination_name ?? "Item") : undefined}
      />
    </>
  );
}
