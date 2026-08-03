import { formatMinutes } from "./formatters.js";

export function findSelectedIndicator(indicators, selectedId) {
  return indicators.find((indicator) => indicator.id === selectedId) || indicators[0];
}

export function isTargetHit(indicator, value) {
  return indicator.direction === "higher" ? value >= indicator.meta : value <= indicator.meta;
}

export function getIndicatorStatus(indicator) {
  if (indicator.ytd === null) {
    return { label: "Sem dado", tone: "muted" };
  }

  if (isTargetHit(indicator, indicator.ytd)) {
    return { label: "Meta atingida", tone: "good" };
  }

  const gap =
    indicator.direction === "higher"
      ? (indicator.meta - indicator.ytd) / Math.max(indicator.meta, 0.0001)
      : (indicator.ytd - indicator.meta) / Math.max(indicator.meta, 0.0001);

  if (gap <= 0.1) {
    return { label: "Atenção", tone: "warn" };
  }

  return { label: "Crítico", tone: "bad" };
}

export function getIndicatorGap(indicator) {
  if (indicator.ytd === null) {
    return null;
  }

  if (indicator.direction === "higher") {
    return ((indicator.ytd - indicator.meta) / Math.max(indicator.meta, 0.0001)) * 100;
  }

  return ((indicator.meta - indicator.ytd) / Math.max(indicator.meta, 0.0001)) * 100;
}

export function buildDailyTimeData(data) {
  return data.tempoDiario.map((day) => ({
    ...day,
    label: `D${day.day}`,
    meta: data.metas.tempoDia,
    pct: Math.round((day.minutes / data.metas.tempoDia) * 100),
    display: formatMinutes(day.minutes),
  }));
}

export function buildMonthlyTimeData(data) {
  return data.tempoMensalMin.map((minutes, index) => ({
    label: data.months[index],
    minutes,
    meta: data.metas.tempoMes,
    display: formatMinutes(minutes),
  }));
}

export function buildAccuracyData(data) {
  return data.acuracidadeDiaria.map((day) => ({
    ...day,
    label: `D${day.day}`,
  }));
}

export function buildInventoryData(data) {
  return data.inventarioDiario.map((day) => ({
    ...day,
    label: `D${day.day}`,
  }));
}

export function buildSelectedSeries(months, indicator) {
  return indicator.monthly.map((value, index) => ({
    label: months[index],
    valor: value,
    meta: indicator.meta,
  }));
}

export function buildDeviationProgression(data) {
  const deviation = findSelectedIndicator(data.indicators, "desvios");
  let accumulated = 0;

  return data.months.map((month, index) => {
    const monthly = deviation.monthly[index] ?? 0;
    accumulated += monthly;
    return { mes: month, mensal: monthly, acumulado: accumulated };
  });
}

export function buildAuditProgression(data) {
  const audit = findSelectedIndicator(data.indicators, "auditoria_5s");
  const points = data.months
    .map((month, index) => ({ mes: month, val: audit.monthly[index] }))
    .filter((point) => point.val !== null && point.val !== undefined);

  return points.map((point, index) => ({
    mes: point.mes,
    nivel: point.val,
    ganho: index === 0 ? 0 : +(point.val - points[index - 1].val).toFixed(2),
    gap: +(100 - point.val).toFixed(2),
  }));
}

export function buildDashboardSummary(data) {
  const dailyTime = buildDailyTimeData(data);
  const avgTempoDiario = Math.round(dailyTime.reduce((sum, day) => sum + day.minutes, 0) / dailyTime.length);
  const bestTempo = dailyTime.reduce((best, current) => (best.minutes < current.minutes ? best : current));
  const worstTempo = dailyTime.reduce((worst, current) => (worst.minutes > current.minutes ? worst : current));
  const onTargetTempo = dailyTime.filter((day) => day.minutes <= data.metas.tempoDia).length;
  const metasBatidas = data.indicators.filter((indicator) => getIndicatorStatus(indicator).tone === "good").length;

  return {
    avgTempoDiario,
    bestTempo,
    dailyTime,
    metasBatidas,
    onTargetTempo,
    worstTempo,
  };
}
