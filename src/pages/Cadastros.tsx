import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CadastroTable } from "@/components/cadastros/CadastroTable";

const tabs = [
  { value: "commodities", label: "Commodities", table: "commodities", columns: ["code", "name_pt", "unit", "is_active"] },
  { value: "locations", label: "Localizações", table: "locations", columns: ["name", "type", "city", "state_code", "is_active"] },
  { value: "counterparties", label: "Contrapartes", table: "counterparties", columns: ["name", "type", "email", "phone", "document_number", "is_active"] },
  { value: "market_quotes", label: "Cotações", table: "market_quotes", columns: ["quote_date", "quote_type", "ticker", "price", "currency", "source"] },
  { value: "model_parameters", label: "Parâmetros", table: "model_parameters", columns: ["parameter_group", "parameter_key", "value_num", "value_text", "unit", "is_active"] },
  { value: "ndf_curves", label: "Curvas NDF", table: "ndf_curves", columns: ["reference_date", "tenor_date", "rate", "source"] },
  { value: "insurance_scenarios", label: "Cenários Seguro", table: "insurance_scenarios", columns: ["code", "label", "strike_pct", "is_active"] },
];

export default function Cadastros() {
  const [activeTab, setActiveTab] = useState("commodities");

  return (
    <div className="space-y-6">
      <PageHeader title="Cadastros" description="Tabelas de referência do sistema" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <CadastroTable tableName={t.table} columns={t.columns} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
