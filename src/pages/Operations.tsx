import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OperationStatus } from "@/types/pricing";

const statusColors: Record<OperationStatus, "default" | "secondary" | "destructive"> = {
  open: "default",
  closed: "secondary",
  cancelled: "destructive",
};

const statusLabels: Record<OperationStatus, string> = {
  open: "Aberta",
  closed: "Fechada",
  cancelled: "Cancelada",
};

export default function Operations() {
  const { operations, updateOperationStatus } = useAppStore();

  const openCount = operations.filter((o) => o.status === "open").length;
  const totalVolume = operations.reduce((s, o) => s + o.volume, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations</h1>
        <p className="text-muted-foreground text-sm mt-1">Histórico oficial de operações do sistema</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Total Operações</p>
            <p className="text-2xl font-bold font-mono">{operations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Abertas</p>
            <p className="text-2xl font-bold font-mono text-primary">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Volume Total (tons)</p>
            <p className="text-2xl font-bold font-mono">{totalVolume.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Última Operação</p>
            <p className="text-sm font-mono">
              {operations.length > 0 ? new Date(operations[0].created_at).toLocaleDateString("pt-BR") : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Operations Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Operações Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma operação registrada</p>
              <p className="text-xs mt-1">Crie operações a partir da Daily Table</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Display</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Futures</TableHead>
                    <TableHead className="text-right">FX</TableHead>
                    <TableHead className="text-right">Orig. Price</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead>Seguro</TableHead>
                    <TableHead>Legs</TableHead>
                    <TableHead>Corretora</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-mono text-sm">{new Date(op.operation_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant={op.commodity === "soybean" ? "default" : "secondary"}>
                          {op.commodity === "soybean" ? "Soja" : "Milho"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{op.display_name}</TableCell>
                      <TableCell>{op.warehouse}</TableCell>
                      <TableCell className="font-mono text-sm">{op.ticker}</TableCell>
                      <TableCell className="data-cell text-right">{op.futures_price.toFixed(2)}</TableCell>
                      <TableCell className="data-cell text-right">{op.exchange_rate.toFixed(4)}</TableCell>
                      <TableCell className="data-cell text-right font-medium">{op.origination_price_brl.toFixed(2)}</TableCell>
                      <TableCell className="data-cell text-right">{op.volume.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{op.insurance_strategy === "none" ? "—" : op.insurance_strategy.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{op.legs}</TableCell>
                      <TableCell className="text-sm">{op.broker}</TableCell>
                      <TableCell>
                        <Select
                          value={op.status}
                          onValueChange={(v) => updateOperationStatus(op.id, v as OperationStatus)}
                        >
                          <SelectTrigger className="h-7 w-[100px]">
                            <Badge variant={statusColors[op.status]}>{statusLabels[op.status]}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Aberta</SelectItem>
                            <SelectItem value="closed">Fechada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
