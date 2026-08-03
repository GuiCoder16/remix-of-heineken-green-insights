import {
  renderAccuracyChart,
  renderAuditChart,
  renderDailyTimeChart,
  renderDeviationChart,
  renderIndicatorChart,
  renderInventoryDailyChart,
  renderInventoryMonthlyChart,
} from "../charts.js";
import { findSelectedIndicator } from "../metrics.js";
import { getChartContainer, setHtml, setText } from "../utils/dom.js";
import { buildSelectedCaption } from "./panels.js";

export function updateDashboardState(refs, state, config) {
  const data = state.data;
  const selected = findSelectedIndicator(data.indicators, state.selectedIndicatorId);

  refs.content.querySelectorAll("[data-indicator-id]").forEach((element) => {
    element.classList.toggle("is-active", element.dataset.indicatorId === selected.id);
  });

  refs.content.querySelectorAll("[data-row-indicator-id]").forEach((element) => {
    element.classList.toggle("is-active", element.dataset.rowIndicatorId === selected.id);
  });

  setText(refs.content.querySelector("[data-selected-group]"), selected.group);
  setText(refs.content.querySelector("[data-selected-title]"), `${selected.name} · Evolução mensal`);
  setHtml(refs.content.querySelector("[data-selected-caption]"), buildSelectedCaption(selected, config));

  refs.content.querySelectorAll("[data-tempo-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tempoView === state.tempoView);
  });

  refs.content.querySelector(`[data-chart="${config.charts.ids.dailyTime}"]`)?.setAttribute("data-view", state.tempoView);
}

export function renderDashboardCharts(refs, state, chartManager, config, previousState = null) {
  const data = state.data;
  const selected = findSelectedIndicator(data.indicators, state.selectedIndicatorId);
  const ids = config.charts.ids;
  const shouldRenderAll = !previousState || previousState.data !== state.data;
  const selectedChanged = shouldRenderAll || previousState.selectedIndicatorId !== state.selectedIndicatorId;
  const tempoViewChanged = shouldRenderAll || previousState.tempoView !== state.tempoView;

  if (selectedChanged) {
    renderIndicatorChart(chartManager, getChartContainer(refs, ids.indicator), {
      chartId: ids.indicator,
      config,
      indicator: selected,
      months: data.months,
    });
  }

  if (tempoViewChanged) {
    renderDailyTimeChart(chartManager, getChartContainer(refs, ids.dailyTime), {
      chartId: ids.dailyTime,
      config,
      data,
      meta: data.metas.tempoDia,
      view: state.tempoView,
    });
  }

  if (!shouldRenderAll) {
    return;
  }

  renderInventoryMonthlyChart(chartManager, getChartContainer(refs, ids.monthlyTime), {
    chartId: ids.monthlyTime,
    config,
    data,
    meta: data.metas.tempoMes,
  });

  renderAccuracyChart(chartManager, getChartContainer(refs, ids.accuracy), {
    chartId: ids.accuracy,
    config,
    data,
    meta: data.metas.acuracidade,
  });

  renderInventoryDailyChart(chartManager, getChartContainer(refs, ids.inventory), {
    chartId: ids.inventory,
    config,
    data,
    meta: data.metas.inventarioDia,
  });

  renderDeviationChart(chartManager, getChartContainer(refs, ids.deviation), {
    chartId: ids.deviation,
    config,
    data,
  });

  renderAuditChart(chartManager, getChartContainer(refs, ids.audit), {
    chartId: ids.audit,
    config,
    data,
  });
}
