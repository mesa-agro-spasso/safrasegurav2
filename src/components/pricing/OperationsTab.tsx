import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import OperationDetail from "./OperationDetail";

interface Props {
  operations: Record<string, unknown>[];
}

const COLS = [
  { key: "created_at", label: "Criado em" },
  { key: "display_name", label: "Display Name" },
  { key: "commodity", label: "Commodity" },
  { key: "warehouse", label: "Warehouse" },
  { key: "ticker", label: "Ticker" },
  { key: "maturity", label: "Maturity" },
  { key: "volume", label: "Volume", numeric: true },
  { key: "gross_price_brl", label: "Gross BRL", numeric: true },
  { key: "origination_price_brl", label: "Orig. Price", numeric: true },
  { key: "purchased_basis_brl", label: "Purch. Basis", numeric: true },
  { key: "breakeven_basis_brl", label: "BE Basis", numeric: true },
  { key: "insurance_strategy", label: "Insurance" },
  { key: "insurance_premium_brl", label: "Ins. Prêmio", numeric: true },
  { key: "status", label: "Status" },
];

function fmtVal(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (key === "created_at") return new Date(String(val)).toLocaleString("pt-BR");
  if (typeof val === "number") return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  return String(val);
}

export default function OperationsTab({ operations }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const filtered = useMemo(() => {
    if (!search) return operations;
    const q = search.toLowerCase();
    return operations.filter((op) => {
      const dn = String(op.display_name ?? "").toLowerCase();
      const cm = String(op.commodity ?? "").toLowerCase();
      return dn.includes(q) || cm.includes(q);
    });
  }, [operations, search]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Operações ({filtered.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou commodity..."
              className="pl-7 h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {COLS.map((c) => (
                    <TableHead key={c.key} className={`text-xs whitespace-nowrap ${c.numeric ? "text-right" : ""}`}>{c.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={COLS.length} className="text-center text-muted-foreground text-xs py-8">Nenhuma operação encontrada.</TableCell></TableRow>
                ) : filtered.map((op) => (
                  <TableRow key={String(op.id)} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(op)}>
                    {COLS.map((c) => (
                      <TableCell key={c.key} className={`text-xs font-mono ${c.numeric ? "text-right" : ""}`}>
                        {c.key === "status" ? <Badge variant="outline" className="text-[10px]">{String(op.status ?? "open")}</Badge> : fmtVal(c.key, op[c.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <OperationDetail open={!!selected} onOpenChange={(o) => !o && setSelected(null)} operation={selected} />
    </>
  );
}
