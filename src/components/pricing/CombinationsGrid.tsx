import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

const BASE_COLUMNS = [
  "combination_name", "commodity", "warehouse", "ticker", "maturity",
  "payment_date", "sale_date", "reception_date", "volume",
  "futures_price", "exchange_rate", "ndf_forward_rate",
  "target_basis_brl", "purchased_basis_brl",
  "insurance_strategy", "insurance_premium_brl", "insurance_strike",
];

const NUMERIC_COLS = new Set([
  "volume", "futures_price", "exchange_rate", "ndf_forward_rate",
  "target_basis_brl", "purchased_basis_brl", "insurance_premium_brl", "insurance_strike",
]);

const DATE_COLS = new Set(["payment_date", "sale_date", "reception_date"]);

interface Props {
  data: Record<string, unknown>[];
  onChange: (data: Record<string, unknown>[]) => void;
}

export default function CombinationsGrid({ data, onChange }: Props) {
  const columns = useMemo(() => {
    const extraKeys = new Set<string>();
    data.forEach((row) => Object.keys(row).forEach((k) => { if (!BASE_COLUMNS.includes(k)) extraKeys.add(k); }));
    return [...BASE_COLUMNS, ...Array.from(extraKeys)];
  }, [data]);

  const handleCellChange = (rowIdx: number, col: string, rawValue: string) => {
    const newData = data.map((r, i) => {
      if (i !== rowIdx) return r;
      const updated = { ...r };
      if (NUMERIC_COLS.has(col)) {
        updated[col] = rawValue === "" ? null : Number(rawValue);
      } else {
        updated[col] = rawValue;
      }
      return updated;
    });
    onChange(newData);
  };

  const addRow = () => {
    const empty: Record<string, unknown> = {};
    BASE_COLUMNS.forEach((c) => { empty[c] = NUMERIC_COLS.has(c) ? null : ""; });
    onChange([...data, empty]);
  };

  const deleteRow = (idx: number) => onChange(data.filter((_, i) => i !== idx));

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Combinations ({data.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                {columns.map((col) => (
                  <TableHead key={col} className="text-xs whitespace-nowrap min-w-[100px]">{col}</TableHead>
                ))}
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="text-center text-muted-foreground text-xs py-8">
                    Nenhuma combinação. Clique em "Adicionar".
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col} className="p-1">
                        <Input
                          type={NUMERIC_COLS.has(col) ? "number" : DATE_COLS.has(col) ? "date" : "text"}
                          step={NUMERIC_COLS.has(col) ? "any" : undefined}
                          value={row[col] != null ? String(row[col]) : ""}
                          onChange={(e) => handleCellChange(idx, col, e.target.value)}
                          className="font-mono h-7 text-xs min-w-[90px]"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="p-1">
                      <Button variant="ghost" size="sm" onClick={() => deleteRow(idx)} className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
