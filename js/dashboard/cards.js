import { formatValue } from "../formatters.js";
import { getIndicatorGap, getIndicatorStatus } from "../metrics.js";
import { escapeAttr, escapeHtml } from "../utils/html.js";

export function renderHeader(data, summary) {
  return `
    <header class="app-header">
      <div class="app-brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 2l2.39 4.84L19.8 7.6l-3.9 3.8.92 5.36L12 14.24 7.18 16.76l.92-5.36L4.2 7.6l5.41-.76L12 2z"></path>
          </svg>
        </span>
        <div>
          <p class="app-eyebrow">Heineken · Operations BI · YTD</p>
          <h1 class="app-title">Painel de Indicadores</h1>
          <p class="app-subtitle">
            Visão consolidada dos indicadores operacionais — planejamento,
            armazém, serviço, produtividade, custo, logística, qualidade e
            segurança.
          </p>
        </div>
      </div>
      <div class="header-meta">
        <span class="status-pill">${summary.metasBatidas}/${data.indicators.length} indicadores dentro da meta</span>
        <span class="header-source">Fonte: Indicadores BI · YTD (Jan–Set)</span>
      </div>
    </header>
  `;
}

export function renderIndicatorGrid(indicators, selectedId, config) {
  return `
    <section class="kpi-grid" aria-label="Indicadores YTD">
      ${indicators.map((indicator) => renderIndicatorCard(indicator, indicator.id === selectedId, config)).join("")}
    </section>
  `;
}

export function renderStatusBadge(status, compact = false) {
  return `
    <span class="status-badge tone-${status.tone}${compact ? " is-compact" : ""}">
      <span class="status-dot" aria-hidden="true"></span>
      ${escapeHtml(status.label)}
    </span>
  `;
}

function renderIndicatorCard(indicator, active, config) {
  const status = getIndicatorStatus(indicator);
  const gap = getIndicatorGap(indicator);
  const activeClass = active ? " is-active" : "";
  const gapClass = gap === null ? "" : gap >= 0 ? " text-brand" : " text-destructive";
  const gapText = gap === null ? "" : `<span class="metric-gap${gapClass}">${gap >= 0 ? "+" : ""}${gap.toFixed(1)}%</span>`;

  return `
    <button class="indicator-card tone-${status.tone}${activeClass}" type="button" data-indicator-id="${escapeAttr(indicator.id)}">
      <span class="indicator-card-bar" aria-hidden="true"></span>
      <span class="indicator-card-head">
        <span>
          <span class="kpi-group">${escapeHtml(indicator.group)}</span>
          <span class="kpi-name">${escapeHtml(indicator.name)}</span>
        </span>
        ${renderStatusBadge(status, true)}
      </span>
      <span class="kpi-value">${formatValue(indicator.ytd, indicator.unit, config.charts.format)}</span>
      <span class="kpi-meta-row">
        <span>Meta <span class="kpi-meta-value">${formatValue(indicator.meta, indicator.unit, config.charts.format)}</span></span>
        ${gapText}
      </span>
    </button>
  `;
}
