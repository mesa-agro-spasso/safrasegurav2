import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";
import type { Combination, Commodity } from "@/types/pricing";

export default function CombinationsPage() {
  const { combinations, updateCombination, addCombination, removeCombination, saveCombinationsToDb } = useAppStore();

  const handleAdd = () => {
    const newCombo: Combination = {
      id: crypto.randomUUID(),
      commodity: "soybean",
      display_name: "",
      warehouse: "",
      ticker: "",
      contract_price: 0,
      maturity: "",
      payment_date: "",
      reception_date: "",
      sale_date: "",
      target_basis: 0,
      additional_discount: 0,
      override_interest_rate: null,
      override_storage_cost: null,
      override_reception_cost: null,
      override_desk_cost: null,
      override_brokerage: null,
      override_risk_premium: null,
    };
    addCombination(newCombo);
  };

  const handleSave = async () => {
    await saveCombinationsToDb();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Combinations</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciamento de combinações de pricing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1" />
            Salvar
          </Button>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Commodity</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Reception</TableHead>
                  <TableHead>Sale</TableHead>
                  <TableHead className="text-right">Basis</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinations.map((c) => (
                  <CombinationRow key={c.id} combination={c} onUpdate={updateCombination} onRemove={removeCombination} />
                ))}
                {combinations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      Nenhuma combinação. Clique em "Adicionar" para criar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Override Parameters */}
      {combinations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sobrescrições de Parâmetros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display</TableHead>
                    <TableHead className="text-right">Juros (%)</TableHead>
                    <TableHead className="text-right">Storage</TableHead>
                    <TableHead className="text-right">Recepção</TableHead>
                    <TableHead className="text-right">Desk Cost</TableHead>
                    <TableHead className="text-right">Corretagem</TableHead>
                    <TableHead className="text-right">Risco (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinations.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.display_name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <OverrideInput value={c.override_interest_rate} onChange={(v) => updateCombination(c.id, { override_interest_rate: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <OverrideInput value={c.override_storage_cost} onChange={(v) => updateCombination(c.id, { override_storage_cost: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <OverrideInput value={c.override_reception_cost} onChange={(v) => updateCombination(c.id, { override_reception_cost: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <OverrideInput value={c.override_desk_cost} onChange={(v) => updateCombination(c.id, { override_desk_cost: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <OverrideInput value={c.override_brokerage} onChange={(v) => updateCombination(c.id, { override_brokerage: v })} />
                      </TableCell>
                      <TableCell className="text-right">
                        <OverrideInput value={c.override_risk_premium} onChange={(v) => updateCombination(c.id, { override_risk_premium: v })} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Campos vazios herdam os parâmetros globais</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CombinationRow({
  combination: c,
  onUpdate,
  onRemove,
}: {
  combination: Combination;
  onUpdate: (id: string, updates: Partial<Combination>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <Select value={c.commodity} onValueChange={(v) => onUpdate(c.id, { commodity: v as Commodity })}>
          <SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="soybean">Soja</SelectItem>
            <SelectItem value="corn">Milho</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[160px]" value={c.display_name} onChange={(e) => onUpdate(c.id, { display_name: e.target.value })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[120px]" value={c.warehouse} onChange={(e) => onUpdate(c.id, { warehouse: e.target.value })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[80px]" value={c.ticker} onChange={(e) => onUpdate(c.id, { ticker: e.target.value })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[90px] text-right" type="number" value={c.contract_price} onChange={(e) => onUpdate(c.id, { contract_price: Number(e.target.value) })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[100px]" type="month" value={c.maturity} onChange={(e) => onUpdate(c.id, { maturity: e.target.value })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[120px]" type="date" value={c.payment_date} onChange={(e) => onUpdate(c.id, { payment_date: e.target.value })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[120px]" type="date" value={c.reception_date} onChange={(e) => onUpdate(c.id, { reception_date: e.target.value })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[120px]" type="date" value={c.sale_date} onChange={(e) => onUpdate(c.id, { sale_date: e.target.value })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[80px] text-right" type="number" value={c.target_basis} onChange={(e) => onUpdate(c.id, { target_basis: Number(e.target.value) })} />
      </TableCell>
      <TableCell>
        <Input className="grid-input w-[80px] text-right" type="number" value={c.additional_discount} onChange={(e) => onUpdate(c.id, { additional_discount: Number(e.target.value) })} />
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(c.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function OverrideInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <Input
      className="grid-input w-[80px] text-right"
      type="number"
      step={0.01}
      value={value ?? ""}
      placeholder="—"
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}
