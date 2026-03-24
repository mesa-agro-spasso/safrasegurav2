import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Plus, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { PricingResult, InsuranceStrategy } from "@/types/pricing";

export default function DailyTable() {
  const { dailyTable, generateTable, operations, addOperation } = useAppStore();
  const [selectedResult, setSelectedResult] = useState<PricingResult | null>(null);
  const [showCreateOp, setShowCreateOp] = useState(false);
  const [opForm, setOpForm] = useState({
    volume: "",
    operation_date: new Date().toISOString().split("T")[0],
    broker: "",
    account: "",
    notes: "",
    insurance_strategy: "none" as InsuranceStrategy,
  });

  const handleCreateOperation = () => {
    if (!selectedResult) return;
    const insuranceResult = dailyTable?.insurance.find(
      (i) => i.combination_id === selectedResult.combination_id && i.strategy === opForm.insurance_strategy
    );
    addOperation({
      pricingResult: selectedResult,
      insuranceResult,
      volume: Number(opForm.volume),
      operation_date: opForm.operation_date,
      broker: opForm.broker,
      account: opForm.account,
      notes: opForm.notes,
      insurance_strategy: opForm.insurance_strategy,
    });
    setShowCreateOp(false);
    setSelectedResult(null);
    setOpForm({ volume: "", operation_date: new Date().toISOString().split("T")[0], broker: "", account: "", notes: "", insurance_strategy: "none" });
  };

  const statusConfig = {
    current: { label: "Atualizada", icon: CheckCircle2, className: "status-badge-active" },
    stale: { label: "Defasada", icon: AlertTriangle, className: "status-badge-stale" },
    not_generated: { label: "Não gerada", icon: Clock, className: "status-badge-stale" },
  };

  const status = dailyTable?.status ?? "not_generated";
  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Table</h1>
          <p className="text-muted-foreground text-sm mt-1">Tabela diária de precificação agrícola</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={statusConfig[status].className}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig[status].label}
          </div>
          {dailyTable && (
            <span className="text-xs text-muted-foreground">
              Gerada em: {new Date(dailyTable.generated_at).toLocaleString("pt-BR")}
            </span>
          )}
          <Button onClick={generateTable} size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Gerar Tabela
          </Button>
        </div>
      </div>

      {/* Main Pricing Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resultados de Precificação</CardTitle>
        </CardHeader>
        <CardContent>
          {!dailyTable ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TableIcon className="h-12 w-12 mb-3 opacity-30" />
              <p>Nenhuma tabela gerada</p>
              <p className="text-xs mt-1">Vá em Parameters e gere os resultados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Display</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Futures</TableHead>
                    <TableHead className="text-right">FX</TableHead>
                    <TableHead className="text-right">Gross BRL</TableHead>
                    <TableHead className="text-right">Custos</TableHead>
                    <TableHead className="text-right">Orig. Price</TableHead>
                    <TableHead className="text-right">Basis</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyTable.results.map((r) => (
                    <TableRow key={r.combination_id}>
                      <TableCell>
                        <Badge variant={r.combination.commodity === "soybean" ? "default" : "secondary"}>
                          {r.combination.commodity === "soybean" ? "Soja" : "Milho"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{r.combination.display_name}</TableCell>
                      <TableCell>{r.combination.warehouse}</TableCell>
                      <TableCell className="data-cell">{r.combination.ticker}</TableCell>
                      <TableCell className="data-cell text-right">{r.futures_price.toFixed(2)}</TableCell>
                      <TableCell className="data-cell text-right">{r.exchange_rate.toFixed(4)}</TableCell>
                      <TableCell className="data-cell text-right">{r.gross_price_brl.toFixed(2)}</TableCell>
                      <TableCell className="data-cell text-right text-destructive">{r.net_costs_brl.toFixed(2)}</TableCell>
                      <TableCell className="data-cell text-right font-medium">{r.origination_price_brl.toFixed(2)}</TableCell>
                      <TableCell className="data-cell text-right">{r.purchased_basis_brl.toFixed(2)}</TableCell>
                      <TableCell className={`data-cell text-right font-medium ${r.margin_brl >= 0 ? "text-primary" : "text-destructive"}`}>
                        {r.margin_brl.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedResult(r); setShowCreateOp(true); }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Operação
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance Table */}
      {dailyTable && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tabela de Seguros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display</TableHead>
                    <TableHead>Estratégia</TableHead>
                    <TableHead className="text-right">Strike</TableHead>
                    <TableHead className="text-right">Prêmio USD</TableHead>
                    <TableHead className="text-right">Prêmio BRL</TableHead>
                    <TableHead className="text-right">Preço Segurado BRL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyTable.insurance.map((ins, i) => {
                    const result = dailyTable.results.find((r) => r.combination_id === ins.combination_id);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{result?.combination.display_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{ins.strategy.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="data-cell text-right">{ins.strike_price.toFixed(2)}</TableCell>
                        <TableCell className="data-cell text-right">{ins.premium_usd.toFixed(2)}</TableCell>
                        <TableCell className="data-cell text-right">{ins.premium_brl.toFixed(2)}</TableCell>
                        <TableCell className="data-cell text-right font-medium">{ins.insured_price_brl.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Operation Dialog */}
      <Dialog open={showCreateOp} onOpenChange={setShowCreateOp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Operação</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">{selectedResult.combination.display_name}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {selectedResult.combination.ticker} | Orig: R$ {selectedResult.origination_price_brl.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Volume (tons)</Label>
                  <Input type="number" value={opForm.volume} onChange={(e) => setOpForm({ ...opForm, volume: e.target.value })} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>Data da Operação</Label>
                  <Input type="date" value={opForm.operation_date} onChange={(e) => setOpForm({ ...opForm, operation_date: e.target.value })} className="font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Corretora</Label>
                  <Input value={opForm.broker} onChange={(e) => setOpForm({ ...opForm, broker: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Conta</Label>
                  <Input value={opForm.account} onChange={(e) => setOpForm({ ...opForm, account: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Estratégia de Seguro</Label>
                <Select value={opForm.insurance_strategy} onValueChange={(v) => setOpForm({ ...opForm, insurance_strategy: v as InsuranceStrategy })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Seguro</SelectItem>
                    <SelectItem value="atm">ATM</SelectItem>
                    <SelectItem value="otm_5">OTM 5%</SelectItem>
                    <SelectItem value="otm_10">OTM 10%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea value={opForm.notes} onChange={(e) => setOpForm({ ...opForm, notes: e.target.value })} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateOp(false)}>Cancelar</Button>
            <Button onClick={handleCreateOperation}>Criar Operação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableIcon({ className }: { className?: string }) {
  return <TableProperties className={className} />;
}

import { TableProperties } from "lucide-react";
