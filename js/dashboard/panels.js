import { formatMinutes, formatValue } from "../formatters.js";
import { escapeAttr, escapeHtml } from "../utils/html.js";

export function renderSelectedTrendPanel(selected, config) {
  const chartId = config.charts.ids.indicator;

  return `
    <section class="panel panel-featured chart-section" aria-labelledby="selected-chart-title">
      <div class="panel-header">
        <div>
          <p class="section-eyebrow" data-selected-group>${escapeHtml(selected.group)}</p>
          <h2 id="selected-chart-title" class="section-title" data-selected-title>${escapeHtml(selected.name)} · Evolução mensal</h2>
          <p class="section-caption" data-selected-caption>
            ${buildSelectedCaption(selected, config)}
          </p>
        </div>
        <div class="legend-row" aria-label="Legenda">
          ${renderLegendDot("legend-brand", "Resultado")}
          ${renderLegendDot("legend-gold legend-dashed", "Meta")}
        </div>
      </div>
      <div class="chart-frame chart-frame-large" id="${chartId}-chart" data-chart="${chartId}" role="img" aria-label="Gráfico de evolução mensal do indicador selecionado"></div>
    </section>
  `;
}

export function renderTempoDiarioPanel(summary, tempoView, config) {
  const chartId = config.charts.ids.dailyTime;

  return `
    <section class="panel panel-featured chart-section" aria-labelledby="daily-time-title">
      <div class="panel-header panel-header-balanced">
        <div>
          <p class="section-eyebrow">Inventário · Diário</p>
          <h2 id="daily-time-title" class="section-title">Tempo de execução vs. Meta 2:00</h2>
          <p class="section-caption">
            Média MTD:
            <span class="mono text-brand-deep">${formatMinutes(summary.avgTempoDiario)}</span>
            · Melhor: D${summary.bestTempo.day} (${formatMinutes(summary.bestTempo.minutes)}) · Pior:
            D${summary.worstTempo.day} (${formatMinutes(summary.worstTempo.minutes)}) ·
            ${summary.onTargetTempo}/${summary.dailyTime.length} dias dentro da meta
          </p>
        </div>
        <div class="segmented-control" role="group" aria-label="Visualização do tempo diário">
          <button class="${tempoView === "bar" ? "is-active" : ""}" type="button" data-tempo-view="bar">Barras</button>
          <button class="${tempoView === "area" ? "is-active" : ""}" type="button" data-tempo-view="area">Tendência</button>
        </div>
      </div>
      <div class="chart-frame chart-frame-daily" id="${chartId}-chart" data-chart="${chartId}" data-view="${escapeAttr(tempoView)}" role="img" aria-label="Gráfico diário do tempo de inventário"></div>
    </section>
  `;
}

export function renderOperationalChartPanels(config) {
  const ids = config.charts.ids;
  return `
    <section class="chart-grid chart-grid-two">
      ${renderSmallChartPanel("Inventário · Mensal", "Tempo total por mês (meta 8:00)", ids.monthlyTime)}
      ${renderSmallChartPanel("Acuracidade · Diária", "% de acuracidade por dia (meta 95%)", ids.accuracy)}
      ${renderSmallChartPanel("Inventário · Diário", "Execução do inventário por dia (meta 95%)", ids.inventory, true)}
    </section>
  `;
}

export function renderProgressionPanels(config) {
  const ids = config.charts.ids;
  return `
    <section class="chart-grid chart-grid-two progression-grid">
      ${renderSmallChartPanel(
        "Desvios · Progressão",
        "Desvios no mês vs. acumulado no ano",
        ids.deviation,
        false,
        "Barras = desvios abertos no mês · Linha = acumulado YTD (quanto mais plana a curva, melhor a evolução)",
      )}
      ${renderSmallChartPanel(
        "Auditoria 5S · Progressão",
        "Evolução do score e ganho mês a mês",
        ids.audit,
        false,
        "Barras = ganho em pontos percentuais · Linha = score 5S acumulado rumo à meta de 100%",
      )}
    </section>
  `;
}

export function renderFooter() {
  return `
    <footer class="app-footer">
      <span>Heineken · Indicadores BI · YTD 2025</span>
      <span class="sync-status">
        <span class="sync-dot" aria-hidden="true"></span>
        Dados sincronizados
      </span>
    </footer>
  `;
}

export function buildSelectedCaption(selected, config) {
  const targetText = selected.direction === "higher" ? "Meta: acima ou igual a" : "Meta: abaixo ou igual a";

  return `
    ${targetText}
    <span class="mono">${formatValue(selected.meta, selected.unit, config.charts.format)}</span>
    · YTD:
    <span class="mono text-brand-deep">${formatValue(selected.ytd, selected.unit, config.charts.format)}</span>
  `;
}

function renderSmallChartPanel(eyebrow, title, chartId, wide = false, caption = "") {
  return `
    <section class="panel chart-panel${wide ? " chart-panel-wide" : ""}" aria-labelledby="${chartId}-title">
      <p class="section-eyebrow">${escapeHtml(eyebrow)}</p>
      <h3 id="${chartId}-title" class="section-title">${escapeHtml(title)}</h3>
      ${caption ? `<p class="section-caption compact-caption">${escapeHtml(caption)}</p>` : ""}
      <div class="chart-frame" id="${escapeAttr(chartId)}-chart" data-chart="${escapeAttr(chartId)}" role="img" aria-label="${escapeAttr(title)}"></div>
    </section>
  `;
}

function renderLegendDot(tone, label) {
  return `
    <span class="legend-dot ${escapeAttr(tone)}">
      <span aria-hidden="true"></span>
      ${escapeHtml(label)}
    </span>
  `;
}
