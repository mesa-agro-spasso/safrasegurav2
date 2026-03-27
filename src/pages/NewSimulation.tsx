import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";
import { createPricingInput, fetchCommodities, fetchLocations, fetchCounterparties } from "@/lib/services/api";
import { toast } from "sonner";

const defaultForm: Record<string, any> = {
  simulation_date: new Date().toISOString().split("T")[0],
  commodity_id: "",
  praca_id: null,
  armazem_id: null,
  counterparty_id: null,
  payment_date: "",
  sale_date: "",
  grain_reception_date: null,
  futures_market: "",
  futures_ticker: "",
  futures_expiration: null,
  futures_price: null,
  spot_fx: null,
  forward_fx: null,
  b3_futures_brl: null,
  target_basis: null,
  purchased_basis: null,
  target_price: null,
  interest_rate: null,
  storage_cost: null,
  reception_cost: null,
  brokerage_per_contract: null,
  desk_cost_pct: null,
  shrinkage_rate_monthly: null,
  rounding_increment: null,
  additional_discount_brl: 0,
  include_insurance: false,
  manual_overrides: {},
  notes: "",
};

export default function NewSimulation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({ ...defaultForm });
  const [commodities, setCommodities] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [counterparties, setCounterparties] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([fetchCommodities(), fetchLocations(), fetchCounterparties()])
      .then(([c, l, cp]) => { setCommodities(c); setLocations(l); setCounterparties(cp); })
      .catch(() => toast.error("Erro ao carregar dados auxiliares"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const setNum = (key: string, value: string) => set(key, value === "" ? null : Number(value));

  const handleSubmit = async () => {
    if (!form.commodity_id) { toast.error("Selecione uma commodity"); return; }
    if (!form.payment_date || !form.sale_date) { toast.error("Preencha as datas obrigatórias"); return; }

    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const [k, v] of Object.entries(form)) {
        if (v !== null && v !== "" && v !== undefined) payload[k] = v;
      }
      // Ensure required fields
      payload.commodity_id = form.commodity_id;
      payload.payment_date = form.payment_date;
      payload.sale_date = form.sale_date;
      if (payload.manual_overrides && typeof payload.manual_overrides === "object") {
        payload.manual_overrides = JSON.parse(JSON.stringify(payload.manual_overrides));
      }

      const result = await createPricingInput(payload);
      toast.success("Simulação criada com sucesso!");
      navigate("/simulacoes");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  const pracas = locations.filter((l) => l.type === "praca");
  const armazens = locations.filter((l) => l.type === "armazem");

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Nova Simulação"
        description="Preencha os dados para criar um novo registro de simulação"
        actions={
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Salvar Simulação
          </Button>
        }
      />

      {/* Dados Gerais */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Dados Gerais</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Data da Simulação</Label>
            <Input type="date" value={form.simulation_date} onChange={(e) => set("simulation_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Commodity *</Label>
            <Select value={form.commodity_id} onValueChange={(v) => set("commodity_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {commodities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_pt} ({c.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contraparte</Label>
            <Select value={form.counterparty_id ?? ""} onValueChange={(v) => set("counterparty_id", v || null)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {counterparties.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Praça</Label>
            <Select value={form.praca_id ?? ""} onValueChange={(v) => set("praca_id", v || null)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {pracas.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Armazém</Label>
            <Select value={form.armazem_id ?? ""} onValueChange={(v) => set("armazem_id", v || null)}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {armazens.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data de Pagamento *</Label>
            <Input type="date" value={form.payment_date} onChange={(e) => set("payment_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data de Venda *</Label>
            <Input type="date" value={form.sale_date} onChange={(e) => set("sale_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Recebimento do Grão</Label>
            <Input type="date" value={form.grain_reception_date ?? ""} onChange={(e) => set("grain_reception_date", e.target.value || null)} />
          </div>
        </CardContent>
      </Card>

      {/* Mercado */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mercado</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Mercado Futuro</Label>
            <Input value={form.futures_market} onChange={(e) => set("futures_market", e.target.value)} placeholder="CBOT, B3..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ticker</Label>
            <Input value={form.futures_ticker} onChange={(e) => set("futures_ticker", e.target.value)} placeholder="ZSF26" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vencimento Futuro</Label>
            <Input type="date" value={form.futures_expiration ?? ""} onChange={(e) => set("futures_expiration", e.target.value || null)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Preço Futuro (USD)</Label>
            <Input type="number" step="0.01" value={form.futures_price ?? ""} onChange={(e) => setNum("futures_price", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Câmbio Spot (BRL/USD)</Label>
            <Input type="number" step="0.0001" value={form.spot_fx ?? ""} onChange={(e) => setNum("spot_fx", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Câmbio Forward (BRL/USD)</Label>
            <Input type="number" step="0.0001" value={form.forward_fx ?? ""} onChange={(e) => setNum("forward_fx", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Futuro B3 (BRL)</Label>
            <Input type="number" step="0.01" value={form.b3_futures_brl ?? ""} onChange={(e) => setNum("b3_futures_brl", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Basis e Preço */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Basis e Preço</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Target Basis (BRL)</Label>
            <Input type="number" step="0.01" value={form.target_basis ?? ""} onChange={(e) => setNum("target_basis", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Purchased Basis (BRL)</Label>
            <Input type="number" step="0.01" value={form.purchased_basis ?? ""} onChange={(e) => setNum("purchased_basis", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Target Price (BRL)</Label>
            <Input type="number" step="0.01" value={form.target_price ?? ""} onChange={(e) => setNum("target_price", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Custos */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Custos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Taxa de Juros (%)</Label>
            <Input type="number" step="0.01" value={form.interest_rate ?? ""} onChange={(e) => setNum("interest_rate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Custo Armazenagem</Label>
            <Input type="number" step="0.01" value={form.storage_cost ?? ""} onChange={(e) => setNum("storage_cost", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Custo Recepção</Label>
            <Input type="number" step="0.01" value={form.reception_cost ?? ""} onChange={(e) => setNum("reception_cost", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Corretagem / Contrato</Label>
            <Input type="number" step="0.01" value={form.brokerage_per_contract ?? ""} onChange={(e) => setNum("brokerage_per_contract", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Desk Cost (%)</Label>
            <Input type="number" step="0.01" value={form.desk_cost_pct ?? ""} onChange={(e) => setNum("desk_cost_pct", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Quebra Mensal (%)</Label>
            <Input type="number" step="0.01" value={form.shrinkage_rate_monthly ?? ""} onChange={(e) => setNum("shrinkage_rate_monthly", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Arredondamento</Label>
            <Input type="number" step="0.01" value={form.rounding_increment ?? ""} onChange={(e) => setNum("rounding_increment", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Desconto Adicional (BRL)</Label>
            <Input type="number" step="0.01" value={form.additional_discount_brl ?? 0} onChange={(e) => setNum("additional_discount_brl", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Seguro */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Seguro</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={form.include_insurance} onCheckedChange={(v) => set("include_insurance", v)} />
            <Label className="text-sm">Incluir seguro na simulação</Label>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Observações</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Notas opcionais sobre esta simulação..." rows={3} />
        </CardContent>
      </Card>
    </div>
  );
}
