import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchModelParameters, fetchInsuranceScenarios } from "@/lib/services/api";
import { fmtNum } from "@/lib/formatters";
import { toast } from "sonner";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([fetchModelParameters(), fetchInsuranceScenarios()])
      .then(([p, s]) => { setParams(p); setScenarios(s); })
      .catch(() => toast.error("Erro ao carregar configurações"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const groups = params.reduce<Record<string, any[]>>((acc, p) => {
    const g = p.parameter_group ?? "Outros";
    (acc[g] = acc[g] ?? []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Parâmetros do modelo e configurações do sistema" />

      {/* System Info */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Informações do Sistema</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground text-xs">Versão</span><p className="font-mono font-medium">v2.0</p></div>
            <div><span className="text-muted-foreground text-xs">Engine</span><p className="font-mono font-medium">run_pricing_engine</p></div>
            <div><span className="text-muted-foreground text-xs">Parâmetros Ativos</span><p className="font-mono font-medium">{params.filter((p) => p.is_active).length}</p></div>
            <div><span className="text-muted-foreground text-xs">Cenários de Seguro</span><p className="font-mono font-medium">{scenarios.length}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Model Parameters by Group */}
      {Object.entries(groups).map(([group, items]) => (
        <Card key={group}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{group}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave</TableHead>
                  <TableHead>Valor Numérico</TableHead>
                  <TableHead>Valor Texto</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">{p.parameter_key}</TableCell>
                    <TableCell className="font-mono text-sm">{p.value_num != null ? fmtNum(p.value_num) : "—"}</TableCell>
                    <TableCell className="text-sm">{p.value_text ?? "—"}</TableCell>
                    <TableCell className="text-sm">{p.unit ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{p.description ?? "—"}</TableCell>
                    <TableCell>{p.is_active ? <Badge variant="default" className="text-xs">Ativo</Badge> : <Badge variant="outline" className="text-xs">Inativo</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Insurance Scenarios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Cenários de Seguro</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Strike (%)</TableHead>
                <TableHead>Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-medium">{s.code}</TableCell>
                  <TableCell>{s.label}</TableCell>
                  <TableCell className="font-mono text-right">{fmtNum(s.strike_pct)}</TableCell>
                  <TableCell>{s.is_active ? <Badge variant="default" className="text-xs">Ativo</Badge> : <Badge variant="outline" className="text-xs">Inativo</Badge>}</TableCell>
                </TableRow>
              ))}
              {scenarios.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum cenário configurado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
