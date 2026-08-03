import { buildDashboardSummary, findSelectedIndicator } from "../metrics.js";
import { renderHeader, renderIndicatorGrid } from "./cards.js";
import {
  renderFooter,
  renderOperationalChartPanels,
  renderProgressionPanels,
  renderSelectedTrendPanel,
  renderTempoDiarioPanel,
} from "./panels.js";
import { renderDetailTable, renderMonthlyTable } from "./tables.js";

export function renderDashboardLayout(refs, state, config) {
  const data = state.data;
  const selected = findSelectedIndicator(data.indicators, state.selectedIndicatorId);
  const summary = buildDashboardSummary(data);

  refs.content.innerHTML = `
    ${renderHeader(data, summary)}
    ${renderIndicatorGrid(data.indicators, selected.id, config)}
    ${renderSelectedTrendPanel(selected, config)}
    ${renderTempoDiarioPanel(summary, state.tempoView, config)}
    ${renderOperationalChartPanels(config)}
    ${renderProgressionPanels(config)}
    ${renderMonthlyTable(data.months, data.indicators, config)}
    ${renderDetailTable(data.indicators, selected.id, config)}
    ${renderFooter()}
  `;
}
