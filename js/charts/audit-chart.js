import { buildAuditProgression } from "../metrics.js";
import {
  createBaseOption,
  createCategoryAxis,
  createGrid,
  createMetaLine,
  createTheme,
  createTooltip,
  createValueAxis,
  tooltipBlock,
  tooltipMetric,
  tooltipTitle,
} from "./common/index.js";

export function renderAuditChart(chartManager, container, params) {
  const { chartId, config, data } = params;
  const theme = createTheme(config);
  const audit = buildAuditProgression(data);
  const option = createBaseOption(theme, {
    grid: createGrid(theme, { right: theme.style.grid.compactRight }),
    tooltip: createTooltip(theme, (items) => {
      const payload = audit[items[0].dataIndex];
      return tooltipBlock(theme, [
        tooltipTitle(payload.mes),
        tooltipMetric(theme.text.score5s, `${payload.nivel.toFixed(2)}${theme.format.percentSuffix}`),
        tooltipMetric(theme.text.monthlyGain, `${theme.format.gainPrefix}${payload.ganho}${theme.format.percentagePointSuffix}`),
      ]);
    }),
    xAxis: createCategoryAxis(theme, audit.map((item) => item.mes), true),
    yAxis: [
      createValueAxis(theme, {
        min: theme.style.domains.auditLevel[0],
        max: theme.style.domains.auditLevel[1],
        formatter: (value) => `${value}${theme.format.percentSuffix}`,
      }),
      createValueAxis(theme, {
        min: theme.style.domains.auditGain[0],
        max: theme.style.domains.auditGain[1],
        position: "right",
        formatter: (value) => `${theme.format.gainPrefix}${value}`,
      }),
    ],
    series: [
      {
        type: "bar",
        yAxisIndex: 1,
        data: audit.map((item) => item.ganho),
        barWidth: theme.style.barWidth.progression,
        itemStyle: {
          color: theme.colors.brandGlow,
          borderRadius: theme.style.smallBarRadius,
        },
      },
      {
        type: "line",
        yAxisIndex: 0,
        data: audit.map((item) => item.nivel),
        smooth: theme.style.smooth,
        symbolSize: theme.style.dotRadius + 3,
        lineStyle: {
          color: theme.colors.brandDeep,
          width: theme.style.strongLineWidth,
        },
        itemStyle: {
          color: theme.colors.brandDeep,
        },
        markLine: createMetaLine(theme, 100, theme.text.targetAudit),
      },
    ],
  });

  chartManager.render(chartId, container, option);
}
