import { buildAccuracyData } from "../metrics.js";
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

export function renderAccuracyChart(chartManager, container, params) {
  const { chartId, config, data, meta } = params;
  const theme = createTheme(config);
  const accuracy = buildAccuracyData(data);
  const option = createBaseOption(theme, {
    grid: createGrid(theme, { right: theme.style.grid.compactRight }),
    tooltip: createTooltip(theme, (items) => {
      const point = Array.isArray(items) ? items[0] : items;
      const payload = accuracy[point.dataIndex];
      return tooltipBlock(theme, [
        tooltipTitle(payload.label),
        tooltipMetric(theme.text.accuracy, `${payload.val.toFixed(2)}${theme.format.percentSuffix}`),
      ]);
    }),
    xAxis: createCategoryAxis(theme, accuracy.map((item) => item.label), true),
    yAxis: createValueAxis(theme, {
      min: theme.style.domains.accuracy[0],
      max: theme.style.domains.accuracy[1],
      formatter: (value) => `${value}${theme.format.percentSuffix}`,
    }),
    series: [
      {
        type: "line",
        data: accuracy.map((item) => item.val),
        smooth: theme.style.smooth,
        symbolSize: theme.style.dotRadius + 2,
        lineStyle: {
          color: theme.colors.brand,
          width: theme.style.lineWidth,
        },
        itemStyle: {
          color: theme.colors.brand,
        },
        areaStyle: {
          color: chartManager.linearGradient(theme.gradients.softArea),
        },
        markLine: createMetaLine(theme, meta, theme.text.targetAccuracy),
      },
    ],
  });

  chartManager.render(chartId, container, option);
}
