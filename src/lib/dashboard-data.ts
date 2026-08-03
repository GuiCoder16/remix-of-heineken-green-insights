import raw from "../../public/dashboard-data.json";

export type Direction = "higher" | "lower";
export type Unit = "pct" | "num" | "time" | "money";

export type Indicator = {
  id: string;
  name: string;
  group: string;
  unit: Unit;
  direction: Direction;
  meta: number;
  ytd: number | null;
  monthly: (number | null)[];
};

export type DashboardData = {
  months: string[];
  metas: {
    tempoDia: number;
    acuracidade: number;
    inventarioDia: number;
    tempoMes: number;
  };
  tempoDiario: { day: number; minutes: number }[];
  acuracidadeDiaria: { day: number; val: number }[];
  inventarioDiario: { day: number; val: number }[];
  tempoMensalMin: number[];
  indicators: Indicator[];
};

/**
 * Fonte única de dados do dashboard: /public/dashboard-data.json.
 * Importado estaticamente para não depender de fetch em runtime
 * (funciona em SSR, prerender e na Vercel sem configuração).
 */
export const dashboardData = raw as unknown as DashboardData;
