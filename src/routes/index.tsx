import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { dashboardData } from "../lib/dashboard-data";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Heineken · Painel de Indicadores YTD" },
      {
        name: "description",
        content:
          "Dashboard interativo Heineken — KPIs operacionais YTD: inventário, aderência, ocupação, produtividade, custo e segurança.",
      },
      { property: "og:title", content: "Heineken · Painel de Indicadores YTD" },
      {
        property: "og:description",
        content:
          "Visão consolidada dos indicadores operacionais Heineken (YTD) com tendências mensais e diárias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

/* ============================================================
   Dados: /public/dashboard-data.json
   O JSON é importado estaticamente (bundle) — funciona em SSR,
   no build estático e na Vercel sem fetch em runtime. O mesmo
   arquivo continua servido em /dashboard-data.json.
   ============================================================ */

const MONTHS = dashboardData.months as readonly string[];

type Direction = "higher" | "lower";
type Unit = "pct" | "num" | "time" | "money";

type Indicator = {
  id: string;
  name: string;
  group: string;
  unit: Unit;
  direction: Direction; // higher = maior é melhor
  meta: number;         // meta de referência (YTD ou mensal)
  ytd: number | null;
  monthly: (number | null)[];
};

/** Tempo de inventário diário (min) */
const TEMPO_DIARIO = dashboardData.tempoDiario;
const META_TEMPO_DIA = dashboardData.metas.tempoDia; // 2h em minutos

/** Acuracidade diária (%) */
const ACURACIDADE_DIARIA = dashboardData.acuracidadeDiaria;
const META_ACURACIDADE = dashboardData.metas.acuracidade;

/** Inventário diário — execução (%) */
const INVENTARIO_DIARIO = dashboardData.inventarioDiario;
const META_INVENTARIO_DIA = dashboardData.metas.inventarioDia;

/** Tempo de inventário mensal (min) — convertido de HH:MM:SS */
const TEMPO_MENSAL_MIN = dashboardData.tempoMensalMin;
const META_TEMPO_MES = dashboardData.metas.tempoMes;

const INDICATORS: Indicator[] = dashboardData.indicators as Indicator[];



/* -------------------------- Helpers -------------------------- */

function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function fmtVal(v: number | null, unit: Unit) {
  if (v === null || Number.isNaN(v)) return "—";
  if (unit === "pct") return `${v.toFixed(1)}%`;
  if (unit === "time") return fmtMin(v);
  if (unit === "money")
    return v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function statusOf(ind: Indicator) {
  if (ind.ytd === null) return { label: "Sem dado", tone: "muted" as const };
  const hit =
    ind.direction === "higher" ? ind.ytd >= ind.meta : ind.ytd <= ind.meta;
  if (hit) return { label: "Meta atingida", tone: "good" as const };
  const gap =
    ind.direction === "higher"
      ? (ind.meta - ind.ytd) / Math.max(ind.meta, 0.0001)
      : (ind.ytd - ind.meta) / Math.max(ind.meta, 0.0001);
  if (gap <= 0.1) return { label: "Atenção", tone: "warn" as const };
  return { label: "Crítico", tone: "bad" as const };
}

/* -------------------------- Component -------------------------- */

/** Progressão de Desvios: mensal + acumulado no ano */
const DESVIOS_PROGRESSAO = (() => {
  const monthly = INDICATORS.find((i) => i.id === "desvios")!.monthly;
  let acc = 0;
  return MONTHS.map((m, i) => {
    const val = (monthly[i] ?? 0) as number;
    acc += val;
    return { mes: m, mensal: val, acumulado: acc };
  });
})();

/** Progressão da Auditoria 5S: nível + ganho mês a mês (p.p.) */
const AUDITORIA_PROGRESSAO = (() => {
  const monthly = INDICATORS.find((i) => i.id === "auditoria_5s")!.monthly;
  const pontos = MONTHS.map((m, i) => ({ mes: m, val: monthly[i] })).filter(
    (p) => p.val !== null && p.val !== undefined,
  ) as { mes: string; val: number }[];
  return pontos.map((p, i) => ({
    mes: p.mes,
    nivel: p.val,
    ganho: i === 0 ? 0 : +(p.val - pontos[i - 1].val).toFixed(2),
    gap: +(100 - p.val).toFixed(2),
  }));
})();

function Dashboard() {
  const [selectedId, setSelectedId] = useState<string>("ocupacao");
  const [tempoView, setTempoView] = useState<"bar" | "area">("bar");

  const selected = INDICATORS.find((i) => i.id === selectedId)!;

  const tempoDiario = useMemo(
    () =>
      TEMPO_DIARIO.map((d) => ({
        ...d,
        label: `D${d.day}`,
        meta: META_TEMPO_DIA,
        pct: Math.round((d.minutes / META_TEMPO_DIA) * 100),
        display: fmtMin(d.minutes),
      })),
    [],
  );

  const tempoMensal = useMemo(
    () =>
      TEMPO_MENSAL_MIN.map((v, i) => ({
        label: MONTHS[i],
        minutes: v,
        meta: META_TEMPO_MES,
        display: fmtMin(v),
      })),
    [],
  );

  const acur = useMemo(
    () => ACURACIDADE_DIARIA.map((d) => ({ label: `D${d.day}`, ...d })),
    [],
  );

  const avgTempoDiario = Math.round(
    tempoDiario.reduce((s, d) => s + d.minutes, 0) / tempoDiario.length,
  );
  const bestTempo = tempoDiario.reduce((a, b) =>
    a.minutes < b.minutes ? a : b,
  );
  const worstTempo = tempoDiario.reduce((a, b) =>
    a.minutes > b.minutes ? a : b,
  );
  const onTargetTempo = tempoDiario.filter((d) => d.minutes <= META_TEMPO_DIA)
    .length;

  const metasBatidas = INDICATORS.filter(
    (i) => statusOf(i).tone === "good",
  ).length;

  const selectedSeries = useMemo(
    () =>
      selected.monthly.map((v, i) => ({
        label: MONTHS[i],
        valor: v,
        meta: selected.meta,
      })),
    [selected],
  );

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <Logo/>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
                Heineken · Operations BI · YTD
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-brand-deep md:text-4xl">
                Painel de Indicadores
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Visão consolidada dos indicadores operacionais — planejamento,
                armazém, serviço, produtividade, custo, logística, qualidade e
                segurança.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 md:items-end">
            <span className="rounded-full border border-brand/30 bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-deep">
              {metasBatidas}/{INDICATORS.length} indicadores dentro da meta
            </span>
            <span className="text-xs text-muted-foreground">
              Fonte: Indicadores BI · YTD (Jan–Jul)
            </span>
          </div>
        </header>

        {/* Scoreboard KPI grid */}
        <section className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {INDICATORS.map((ind) => (
            <IndicatorCard
              key={ind.id}
              ind={ind}
              active={ind.id === selectedId}
              onClick={() => setSelectedId(ind.id)}
            />
          ))}
        </section>

        {/* Monthly trend of selected indicator */}
        <section className="mb-10 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_40px_-20px_rgba(4,79,45,0.35)] md:p-8">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                {selected.group}
              </p>
              <h2 className="text-lg font-bold text-brand-deep">
                {selected.name} · Evolução mensal
              </h2>
              <p className="text-xs text-muted-foreground">
                {selected.direction === "higher"
                  ? "Meta: acima ou igual a"
                  : "Meta: abaixo ou igual a"}{" "}
                <span className="font-mono">
                  {fmtVal(selected.meta, selected.unit)}
                </span>
                {" · YTD: "}
                <span className="font-mono text-brand-deep">
                  {fmtVal(selected.ytd, selected.unit)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <LegendDot color="var(--brand)" label="Resultado" />
              <LegendDot color="var(--gold)" label="Meta" dashed />
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer>
              <ComposedChart
                data={selectedSeries}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="selBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-glow)" />
                    <stop offset="100%" stopColor="var(--brand-deep)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (selected.unit === "pct") return `${v}%`;
                    if (selected.unit === "money")
                      return `${Math.round(v / 1000)}k`;
                    return String(v);
                  }}
                />
                <Tooltip
                  content={
                    <IndicatorTip unit={selected.unit} meta={selected.meta} />
                  }
                  cursor={{ fill: "transparent" }}
                />
                <ReferenceLine
                  y={selected.meta}
                  stroke="var(--gold)"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  label={{
                    value: `META ${fmtVal(selected.meta, selected.unit)}`,
                    position: "insideTopRight",
                    fill: "var(--gold)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="valor" radius={[10, 10, 4, 4]} maxBarSize={48}>
                  {selectedSeries.map((d, i) => {
                    const hit =
                      d.valor === null
                        ? false
                        : selected.direction === "higher"
                          ? d.valor >= selected.meta
                          : d.valor <= selected.meta;
                    return (
                      <Cell
                        key={i}
                        fill={
                          d.valor === null
                            ? "var(--muted)"
                            : hit
                              ? "url(#selBar)"
                              : "color-mix(in oklab, var(--destructive) 55%, var(--brand-deep))"
                        }
                      />
                    );
                  })}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--brand-deep)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--brand-deep)" }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Tempo de Inventário — Diário */}
        <section className="mb-10 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_40px_-20px_rgba(4,79,45,0.35)] md:p-8">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                Inventário · Diário
              </p>
              <h2 className="text-lg font-bold text-brand-deep">
                Tempo de execução vs. Meta 2:00
              </h2>
              <p className="text-xs text-muted-foreground">
                Média MTD:{" "}
                <span className="font-mono text-brand-deep">
                  {fmtMin(avgTempoDiario)}
                </span>{" "}
                · Melhor: D{bestTempo.day} ({fmtMin(bestTempo.minutes)}) · Pior:
                D{worstTempo.day} ({fmtMin(worstTempo.minutes)}) ·{" "}
                {onTargetTempo}/{tempoDiario.length} dias dentro da meta
              </p>
            </div>
            <div className="inline-flex rounded-full border border-border bg-secondary/40 p-1">
              <button
                onClick={() => setTempoView("bar")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  tempoView === "bar"
                    ? "bg-brand text-brand-foreground shadow"
                    : "text-muted-foreground hover:text-brand-deep"
                }`}
              >
                Barras
              </button>
              <button
                onClick={() => setTempoView("area")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  tempoView === "area"
                    ? "bg-brand text-brand-foreground shadow"
                    : "text-muted-foreground hover:text-brand-deep"
                }`}
              >
                Tendência
              </button>
            </div>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer>
              {tempoView === "bar" ? (
                <ComposedChart
                  data={tempoDiario}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand-glow)" />
                      <stop offset="100%" stopColor="var(--brand-deep)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 6"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtMin(v)}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, META_TEMPO_DIA + 20]}
                  />
                  <Tooltip content={<TempoTip />} cursor={{ fill: "transparent" }} />
                  <ReferenceLine
                    y={META_TEMPO_DIA}
                    stroke="var(--gold)"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    label={{
                      value: "META 2:00",
                      position: "insideTopRight",
                      fill: "var(--gold)",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                  <Bar dataKey="minutes" radius={[10, 10, 4, 4]} maxBarSize={54}>
                    {tempoDiario.map((_, i) => (
                      <Cell key={i} fill="url(#barFill)" />
                    ))}
                  </Bar>
                </ComposedChart>
              ) : (
                <AreaChart
                  data={tempoDiario}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtMin(v)}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, META_TEMPO_DIA + 20]}
                  />
                  <Tooltip content={<TempoTip />} />
                  <ReferenceLine
                    y={META_TEMPO_DIA}
                    stroke="var(--gold)"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="var(--brand)"
                    strokeWidth={3}
                    fill="url(#areaFill)"
                    dot={{ r: 5, fill: "var(--brand)", stroke: "white", strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Bottom row: Tempo mensal + Acuracidade diária */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
              Inventário · Mensal
            </p>
            <h3 className="text-lg font-bold text-brand-deep">
              Tempo total por mês (meta 8:00)
            </h3>
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer>
                <ComposedChart data={tempoMensal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtMin(v)}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TempoTip />} cursor={{ fill: "transparent" }} />
                  <ReferenceLine
                    y={META_TEMPO_MES}
                    stroke="var(--gold)"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    label={{
                      value: "META 8:00",
                      position: "insideTopRight",
                      fill: "var(--gold)",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                  <Bar dataKey="minutes" radius={[8, 8, 2, 2]} maxBarSize={44}>
                    {tempoMensal.map((d, i) => (
                      <Cell
                        key={i}
                        fill={
                          d.minutes <= META_TEMPO_MES
                            ? "var(--brand)"
                            : "color-mix(in oklab, var(--destructive) 55%, var(--brand-deep))"
                        }
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
              Acuracidade · Diária
            </p>
            <h3 className="text-lg font-bold text-brand-deep">
              % de acuracidade por dia (meta 95%)
            </h3>
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer>
                <AreaChart data={acur} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="acurFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[80, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(2)}%`, "Acuracidade"]}
                    contentStyle={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--card)",
                    }}
                  />
                  <ReferenceLine
                    y={META_ACURACIDADE}
                    stroke="var(--gold)"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    label={{ value: "META 95%", position: "insideTopRight", fill: "var(--gold)", fontSize: 11, fontWeight: 700 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="var(--brand-deep)"
                    strokeWidth={2}
                    fill="url(#acurFill)"
                    dot={{ r: 3, fill: "var(--brand-deep)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
              Inventário · Diário
            </p>
            <h3 className="text-lg font-bold text-brand-deep">
              Execução do inventário por dia (meta 95%)
            </h3>
            <div className="mt-6 h-[240px]">
              <ResponsiveContainer>
                <BarChart
                  data={INVENTARIO_DIARIO.map((d) => ({ label: `D${d.day}`, ...d }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Execução"]}
                    contentStyle={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--card)",
                    }}
                  />
                  <ReferenceLine
                    y={META_INVENTARIO_DIA}
                    stroke="var(--gold)"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    label={{ value: "META 95%", position: "insideTopRight", fill: "var(--gold)", fontSize: 11, fontWeight: 700 }}
                  />
                  <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                    {INVENTARIO_DIARIO.map((d) => (
                      <Cell
                        key={d.day}
                        fill={d.val >= META_INVENTARIO_DIA ? "var(--brand)" : "var(--destructive)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Progressão — Desvios & Auditoria 5S */}
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
              Desvios · Progressão
            </p>
            <h3 className="text-lg font-bold text-brand-deep">
              Desvios no mês vs. acumulado no ano
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Barras = desvios abertos no mês · Linha = acumulado YTD (quanto mais plana a
              curva, melhor a evolução)
            </p>
            <div className="mt-6 h-[300px]">
              <ResponsiveContainer>
                <ComposedChart data={DESVIOS_PROGRESSAO} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="desviosAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand-glow)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--card)" }}
                    formatter={(v: number, n: string) => [v, n === "mensal" ? "No mês" : "Acumulado"]}
                  />
                  <Bar yAxisId="left" dataKey="mensal" radius={[6, 6, 0, 0]} barSize={26} fill="var(--brand)" />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="acumulado"
                    stroke="var(--brand-deep)"
                    strokeWidth={2.5}
                    fill="url(#desviosAcc)"
                    dot={{ r: 3, fill: "var(--brand-deep)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
              Auditoria 5S · Progressão
            </p>
            <h3 className="text-lg font-bold text-brand-deep">
              Evolução do score e ganho mês a mês
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Barras = ganho em pontos percentuais · Linha = score 5S acumulado rumo à meta
              de 100%
            </p>
            <div className="mt-6 h-[300px]">
              <ResponsiveContainer>
                <ComposedChart data={AUDITORIA_PROGRESSAO} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    domain={[70, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 20]} tickFormatter={(v) => `+${v}`} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, background: "var(--card)" }}
                    formatter={(v: number, n: string) =>
                      n === "nivel" ? [`${v.toFixed(2)}%`, "Score 5S"] : [`+${v} p.p.`, "Ganho no mês"]
                    }
                  />
                  <ReferenceLine
                    yAxisId="left"
                    y={100}
                    stroke="var(--gold)"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    label={{ value: "META 100%", position: "insideTopRight", fill: "var(--gold)", fontSize: 11, fontWeight: 700 }}
                  />
                  <Bar yAxisId="right" dataKey="ganho" radius={[6, 6, 0, 0]} barSize={26} fill="var(--brand-glow)" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="nivel"
                    stroke="var(--brand-deep)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--brand-deep)" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Tabela mensal completa */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Resultados Mensais — Todos os Indicadores
          </h3>
          <div className="mt-4 overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3">Indicador</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="px-3 py-3 text-right">
                      {m}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">YTD</th>
                  <th className="px-4 py-3 text-right">Meta</th>
                </tr>
              </thead>
              <tbody>
                {INDICATORS.map((ind) => (
                  <tr key={ind.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-brand-deep">{ind.name}</td>
                    {ind.monthly.map((v, i) => (
                      <td
                        key={i}
                        className={`px-3 py-3 text-right tabular-nums ${
                          v === null
                            ? "text-muted-foreground"
                            : (ind.direction === "higher" ? v >= ind.meta : v <= ind.meta)
                              ? "text-brand"
                              : "text-destructive"
                        }`}
                      >
                        {fmtVal(v, ind.unit)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {fmtVal(ind.ytd, ind.unit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {fmtVal(ind.meta, ind.unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        {/* Tabela detalhada dos indicadores */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Indicadores YTD — Detalhamento
          </h3>
          <div className="mt-4 overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-secondary-foreground">
                <tr>
                  <th className="px-4 py-3">Indicador</th>
                  <th className="px-4 py-3">Grupo</th>
                  <th className="px-4 py-3">Meta</th>
                  <th className="px-4 py-3">YTD</th>
                  <th className="px-4 py-3">Direção</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {INDICATORS.map((ind) => {
                  const st = statusOf(ind);
                  return (
                    <tr
                      key={ind.id}
                      className={`cursor-pointer border-t border-border transition hover:bg-accent/40 ${
                        ind.id === selectedId ? "bg-accent/50" : ""
                      }`}
                      onClick={() => setSelectedId(ind.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-brand-deep">
                        {ind.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ind.group}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {fmtVal(ind.meta, ind.unit)}
                      </td>
                      <td className="px-4 py-3 font-mono text-brand-deep">
                        {fmtVal(ind.ytd, ind.unit)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {ind.direction === "higher" ? "↑ maior é melhor" : "↓ menor é melhor"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={st.tone} label={st.label} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Heineken · Indicadores BI · YTD 2025</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
            Dados sincronizados
          </span>
        </footer>
      </div>
    </main>
  );
}

/* -------------------------- Small components -------------------------- */

function IndicatorCard({
  ind,
  active,
  onClick,
}: {
  ind: Indicator;
  active: boolean;
  onClick: () => void;
}) {
  const st = statusOf(ind);
  const gap =
    ind.ytd === null
      ? null
      : ind.direction === "higher"
        ? ((ind.ytd - ind.meta) / Math.max(ind.meta, 0.0001)) * 100
        : ((ind.meta - ind.ytd) / Math.max(ind.meta, 0.0001)) * 100;

  const toneRing =
    st.tone === "good"
      ? "ring-brand/50"
      : st.tone === "warn"
        ? "ring-[color:var(--gold)]/60"
        : st.tone === "bad"
          ? "ring-destructive/50"
          : "ring-border";

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-15px_rgba(4,79,45,0.4)] ${
        active ? `ring-2 ${toneRing}` : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{
          background:
            st.tone === "good"
              ? "linear-gradient(90deg,var(--brand-glow),var(--brand))"
              : st.tone === "warn"
                ? "linear-gradient(90deg,var(--gold),color-mix(in oklab,var(--gold) 40%, var(--brand-deep)))"
                : st.tone === "bad"
                  ? "linear-gradient(90deg,var(--destructive),var(--brand-deep))"
                  : "linear-gradient(90deg,var(--border),var(--muted))",
        }}
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
            {ind.group}
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-deep">
            {ind.name}
          </p>
        </div>
        <StatusBadge tone={st.tone} label={st.label} compact />
      </div>
      <p className="mt-4 font-mono text-2xl font-bold tracking-tight text-brand-deep">
        {fmtVal(ind.ytd, ind.unit)}
      </p>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Meta{" "}
          <span className="font-mono text-brand-deep/80">
            {fmtVal(ind.meta, ind.unit)}
          </span>
        </span>
        {gap !== null && (
          <span
            className={`font-mono ${
              gap >= 0 ? "text-brand" : "text-destructive"
            }`}
          >
            {gap >= 0 ? "+" : ""}
            {gap.toFixed(1)}%
          </span>
        )}
      </div>
    </button>
  );
}

function StatusBadge({
  tone,
  label,
  compact,
}: {
  tone: "good" | "warn" | "bad" | "muted";
  label: string;
  compact?: boolean;
}) {
  const map = {
    good: { bg: "bg-brand/15", fg: "text-brand-deep", dot: "var(--brand)" },
    warn: {
      bg: "bg-[color-mix(in_oklab,var(--gold)_25%,transparent)]",
      fg: "text-[color:var(--brand-deep)]",
      dot: "var(--gold)",
    },
    bad: { bg: "bg-destructive/15", fg: "text-destructive", dot: "var(--destructive)" },
    muted: { bg: "bg-secondary", fg: "text-muted-foreground", dot: "var(--muted-foreground)" },
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${map.bg} ${map.fg} ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } font-semibold`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: map.dot }} />
      {label}
    </span>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <span
        className="inline-block h-2.5 w-4 rounded-sm"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}

function TempoTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; display: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-brand-deep">{p.label}</p>
      <p className="mt-1 font-mono text-lg text-brand">{p.display}</p>
    </div>
  );
}

function IndicatorTip({
  active,
  payload,
  unit,
  meta,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; valor: number | null } }>;
  unit: Unit;
  meta: number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-brand-deep">{p.label}</p>
      <p className="mt-1 font-mono text-lg text-brand">
        {fmtVal(p.valor, unit)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        Meta {fmtVal(meta, unit)}
      </p>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-glow via-brand to-brand-deep shadow-lg shadow-brand/30">
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="currentColor">
        <path d="M12 2l2.39 4.84L19.8 7.6l-3.9 3.8.92 5.36L12 14.24 7.18 16.76l.92-5.36L4.2 7.6l5.41-.76L12 2z" />
      </svg>
    </div>
  );
}
