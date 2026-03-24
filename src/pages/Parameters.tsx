import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, RefreshCw, TrendingUp, DollarSign, Wheat, BarChart3 } from "lucide-react";
import type { GlobalParameters, OptionType } from "@/types/pricing";
import { useNavigate } from "react-router-dom";

export default function Parameters() {
  const {
    globalParameters,
    setGlobalParameters,
    marketData,
    refreshMarketData,
    combinations,
    generateTable,
  } = useAppStore();
  const navigate = useNavigate();

  const [params, setParams] = useState<GlobalParameters>(globalParameters);

  const updateParam = <K extends keyof GlobalParameters>(key: K, value: GlobalParameters[K]) => {
    setParams((p) => ({ ...p, [key]: value }));
  };

  const handleSave = () => {
    setGlobalParameters(params);
  };

  const handleGenerate = () => {
    setGlobalParameters(params);
    generateTable();
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parameters</h1>
          <p className="text-muted-foreground text-sm mt-1">Centro de controle do sistema de precificação</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>Salvar Parâmetros</Button>
          <Button onClick={handleGenerate}>
            <Play className="h-4 w-4 mr-1" />
            Gerar Daily Table
          </Button>
        </div>
      </div>

      {/* Market Data */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Mercado</CardTitle>
                <CardDescription>Dados de mercado em tempo real</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refreshMarketData}>
              <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">USD/BRL Spot</p>
              <p className="text-lg font-mono font-semibold">{marketData.usd_brl_spot.toFixed(4)}</p>
            </div>
            {Object.entries(marketData.usd_forward).slice(0, 3).map(([k, v]) => (
              <div key={k} className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Forward {k}</p>
                <p className="text-lg font-mono font-semibold">{v.toFixed(4)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1"><Wheat className="h-3.5 w-3.5" /> Soja CBOT</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(marketData.soybean_futures).map(([k, v]) => (
                  <div key={k} className="rounded-sm bg-muted px-2 py-1.5 text-center">
                    <p className="text-xs text-muted-foreground font-mono">{k}</p>
                    <p className="text-sm font-mono font-medium">{v.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> Milho CBOT</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(marketData.corn_cbot_futures).map(([k, v]) => (
                  <div key={k} className="rounded-sm bg-muted px-2 py-1.5 text-center">
                    <p className="text-xs text-muted-foreground font-mono">{k}</p>
                    <p className="text-sm font-mono font-medium">{v.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Parameters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Parâmetros Globais</CardTitle>
              <CardDescription>Parâmetros técnicos, financeiros e operacionais</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Financial */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Financeiros</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ParamInput label="Juros (% a.a.)" value={params.interest_rate} onChange={(v) => updateParam("interest_rate", v)} />
              <ParamInput label="Storage (BRL/bag/mês)" value={params.storage_cost} onChange={(v) => updateParam("storage_cost", v)} />
              <ParamInput label="Recepção (BRL/ton)" value={params.reception_cost} onChange={(v) => updateParam("reception_cost", v)} />
              <ParamInput label="Desk Cost (BRL/ton)" value={params.desk_cost} onChange={(v) => updateParam("desk_cost", v)} />
            </div>
          </div>

          <Separator />

          {/* Operational */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Operacionais</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ParamInput label="Corretagem (BRL/ct)" value={params.brokerage} onChange={(v) => updateParam("brokerage", v)} />
              <ParamInput label="Risco (% )" value={params.risk_premium} onChange={(v) => updateParam("risk_premium", v)} />
              <ParamInput label="Rounding" value={params.rounding} onChange={(v) => updateParam("rounding", v)} step={1} />
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Opção</Label>
                <Select value={params.option_type} onValueChange={(v) => updateParam("option_type", v as OptionType)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="put">Put</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Volatility */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Volatilidade</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ParamInput label="Vol. Soja (%)" value={params.soybean_volatility} onChange={(v) => updateParam("soybean_volatility", v)} />
              <ParamInput label="Vol. Milho (%)" value={params.corn_volatility} onChange={(v) => updateParam("corn_volatility", v)} />
            </div>
          </div>

          <Separator />

          {/* Commodity-specific */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Soja</h3>
              <div className="grid grid-cols-2 gap-3">
                <ParamInput label="Fator Conversão" value={params.soy_conversion_factor} onChange={(v) => updateParam("soy_conversion_factor", v)} step={0.0001} />
                <ParamInput label="Frete Premium (BRL/ton)" value={params.soy_freight_premium} onChange={(v) => updateParam("soy_freight_premium", v)} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Milho</h3>
              <div className="grid grid-cols-2 gap-3">
                <ParamInput label="Fator Conversão" value={params.corn_conversion_factor} onChange={(v) => updateParam("corn_conversion_factor", v)} step={0.0001} />
                <ParamInput label="Frete Premium (BRL/ton)" value={params.corn_freight_premium} onChange={(v) => updateParam("corn_freight_premium", v)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combinations Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Combinações ({combinations.length})</CardTitle>
              <CardDescription>Combinações ativas para geração</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/combinations")}>
              Gerenciar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Display</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Target Basis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinations.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Badge variant={c.commodity === "soybean" ? "default" : "secondary"}>
                        {c.commodity === "soybean" ? "Soja" : "Milho"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{c.display_name}</TableCell>
                    <TableCell>{c.warehouse}</TableCell>
                    <TableCell className="font-mono text-sm">{c.ticker}</TableCell>
                    <TableCell className="font-mono text-sm">{c.maturity}</TableCell>
                    <TableCell className="font-mono text-sm text-right">{c.target_basis.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ParamInput({
  label,
  value,
  onChange,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 font-mono text-sm"
      />
    </div>
  );
}
