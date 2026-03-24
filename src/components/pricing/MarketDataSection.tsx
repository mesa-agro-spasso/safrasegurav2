import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

function renderValue(
  key: string,
  value: unknown,
  path: string[],
  onUpdate: (path: string[], val: unknown) => void
): React.ReactNode {
  if (value === null || value === undefined) {
    return (
      <div key={key} className="space-y-1">
        <Label className="text-xs text-muted-foreground">{key}</Label>
        <Input value="" onChange={(e) => onUpdate(path, e.target.value)} className="font-mono h-8 text-xs" />
      </div>
    );
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return (
      <div key={key} className="col-span-full border rounded-md p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{key}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(obj).map(([k, v]) => renderValue(k, v, [...path, k], onUpdate))}
        </div>
      </div>
    );
  }
  const isNum = typeof value === "number";
  return (
    <div key={key} className="space-y-1">
      <Label className="text-xs text-muted-foreground">{key}</Label>
      <Input
        type={isNum ? "number" : "text"}
        step={isNum ? "any" : undefined}
        value={String(value ?? "")}
        onChange={(e) => {
          const raw = e.target.value;
          onUpdate(path, isNum ? (raw === "" ? 0 : Number(raw)) : raw);
        }}
        className="font-mono h-8 text-xs"
      />
    </div>
  );
}

export default function MarketDataSection({ data, onChange }: Props) {
  const handleUpdate = (path: string[], val: unknown) => {
    const newData = JSON.parse(JSON.stringify(data));
    let ref = newData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!ref[path[i]]) ref[path[i]] = {};
      ref = ref[path[i]];
    }
    ref[path[path.length - 1]] = val;
    onChange(newData);
  };

  const entries = Object.entries(data);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Market Data</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum dado de mercado configurado.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {entries.map(([k, v]) => renderValue(k, v, [k], handleUpdate))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
