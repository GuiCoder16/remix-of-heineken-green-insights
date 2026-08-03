import { buildDeviationProgression } from "../metrics.js";
import {
  createBaseOption,
  createCategoryAxis,
  createGrid,
  createTheme,
  createTooltip,
  createValueAxis,
  tooltipBlock,
  tooltipMetric,
  tooltipTitle,
} from "./common/index.js";

export function renderDeviationChart(chartManager, container, params) {
  const { chartId, config, data } = params;
  const theme = createTheme(config);
  const deviation = buildDeviationProgression(data);
  const option = createBaseOption(theme, {
    grid: createGrid(theme, { right: theme.style.grid.compactRight }),
    tooltip: createTooltip(theme, (items) => {
      const payload = deviation[items[0].dataIndex];
      return tooltipBlock(theme, [
        tooltipTitle(payload.mes),
        tooltipMetric(theme.text.monthlyDeviation, payload.mensal),
        tooltipMetric(theme.text.accumulated, payload.acumulado),
      ]);
    }),
    xAxis: createCategoryAxis(theme, deviation.map((item) => item.mes), true),
    yAxis: [createValueAxis(theme), createValueAxis(theme, { position: "right" })],
    series: [
      {
        type: "bar",
        yAxisIndex: 0,
        data: deviation.map((item) => item.mensal),
        barWidth: theme.style.barWidth.progression,
        itemStyle: {
          color: theme.colors.brand,
          borderRadius: theme.style.smallBarRadius,
        },
      },
      {
        type: "line",
        yAxisIndex: 1,
        data: deviation.map((item) => item.acumulado),
        smooth: theme.style.smooth,
        symbolSize: theme.style.dotRadius + 2,
        lineStyle: {
          color: theme.colors.brandDeep,
          width: theme.style.strongLineWidth - 0.5,
        },
        itemStyle: {
          color: theme.colors.brandDeep,
        },
        areaStyle: {
          color: chartManager.linearGradient(theme.gradients.accumulatedArea),
        },
      },
    ],
  });

  chartManager.render(chartId, container, option);
}
