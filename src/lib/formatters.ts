export const fmtBRL = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

export const fmtUSD = (v: number | null | undefined) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "USD" }) : "—";

export const fmtNum = (v: number | null | undefined, decimals = 2) =>
  v != null ? v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : "—";

export const fmtPct = (v: number | null | undefined, decimals = 2) =>
  v != null ? `${fmtNum(v, decimals)}%` : "—";

export const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v + (v.includes("T") ? "" : "T00:00:00")).toLocaleDateString("pt-BR") : "—";

export const fmtDateTime = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("pt-BR") : "—";

export const fmtFx = (v: number | null | undefined) => fmtNum(v, 4);
