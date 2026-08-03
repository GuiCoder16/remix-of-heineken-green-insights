import { formatValue } from "../formatters.js";
import { getIndicatorStatus, isTargetHit } from "../metrics.js";
import { escapeAttr, escapeHtml } from "../utils/html.js";
import { renderStatusBadge } from "./cards.js";

export function renderMonthlyTable(months, indicators, config) {
  return `
    <section class="panel table-panel" aria-labelledby="monthly-results-title">
      <h3 id="monthly-results-title" class="table-title">Resultados Mensais — Todos os Indicadores</h3>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Indicador</th>
              ${months.map((month) => `<th class="numeric">${escapeHtml(month)}</th>`).join("")}
              <th class="numeric">YTD</th>
              <th class="numeric">Meta</th>
            </tr>
          </thead>
          <tbody>
            ${indicators.map((indicator) => renderMonthlyTableRow(indicator, config)).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function renderDetailTable(indicators, selectedId, config) {
  return `
    <section class="panel table-panel" aria-labelledby="detail-results-title">
      <h3 id="detail-results-title" class="table-title">Indicadores YTD — Detalhamento</h3>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Grupo</th>
              <th>Meta</th>
              <th>YTD</th>
              <th>Direção</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${indicators.map((indicator) => renderDetailTableRow(indicator, indicator.id === selectedId, config)).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMonthlyTableRow(indicator, config) {
  return `
    <tr>
      <td class="strong-cell">${escapeHtml(indicator.name)}</td>
      ${indicator.monthly.map((value) => renderMonthlyValueCell(indicator, value, config)).join("")}
      <td class="numeric strong-number">${formatValue(indicator.ytd, indicator.unit, config.charts.format)}</td>
      <td class="numeric muted-number">${formatValue(indicator.meta, indicator.unit, config.charts.format)}</td>
    </tr>
  `;
}

function renderMonthlyValueCell(indicator, value, config) {
  const tone = value === null ? "muted" : isTargetHit(indicator, value) ? "good" : "bad";
  return `<td class="numeric value-${tone}">${formatValue(value, indicator.unit, config.charts.format)}</td>`;
}

function renderDetailTableRow(indicator, active, config) {
  const status = getIndicatorStatus(indicator);
  const direction = indicator.direction === "higher" ? "↑ maior é melhor" : "↓ menor é melhor";

  return `
    <tr class="clickable-row${active ? " is-active" : ""}" tabindex="0" role="button" data-indicator-id="${escapeAttr(indicator.id)}" data-row-indicator-id="${escapeAttr(indicator.id)}">
      <td class="strong-cell">${escapeHtml(indicator.name)}</td>
      <td class="muted-cell">${escapeHtml(indicator.group)}</td>
      <td class="mono">${formatValue(indicator.meta, indicator.unit, config.charts.format)}</td>
      <td class="mono text-brand-deep">${formatValue(indicator.ytd, indicator.unit, config.charts.format)}</td>
      <td class="muted-cell direction-cell">${escapeHtml(direction)}</td>
      <td>${renderStatusBadge(status)}</td>
    </tr>
  `;
}
