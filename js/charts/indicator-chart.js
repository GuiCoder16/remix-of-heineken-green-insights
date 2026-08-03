import { formatAxisValue, formatValue } from "../formatters.js";
import { buildSelectedSeries } from "../metrics.js";
import {
  createBaseOption,
  createCategoryAxis,
  createGrid,
  createMetaLine,
  createTheme,
  createTooltip,
  createValueAxis,
  getIndicatorBarColor,
  tooltipBlock,
  tooltipMetric,
  tooltipMuted,
  tooltipTitle,
  tooltipValue,
} from "./common/index.js";

export function renderIndicatorChart(chartManager, container, params) {
  const { chartId, config, indicator, months } = params;
  const theme = createTheme(config);
  const data = buildSelectedSeries(months, indicator);
  const barGradient = chartManager.linearGradient(theme.gradients.brandBar);
  const option = createBaseOption(theme, {
    grid: createGrid(theme),
    tooltip: createTooltip(theme, (items) => {
      const point = Array.isArray(items) ? items[0] : items;
      const payload = data[point.dataIndex];
      return tooltipBlock(theme, [
        tooltipTitle(payload.label),
        tooltipValue(formatValue(payload.valor, indicator.unit, theme.format)),
        tooltipMuted(`${theme.text.target} ${formatValue(indicator.meta, indicator.unit, theme.format)}`),
      ]);
    }),
    xAxis: createCategoryAxis(theme, data.map((item) => item.label)),
    yAxis: createValueAxis(theme, {
      formatter: (value) => formatAxisValue(value, indicator.unit, theme.format),
    }),
    series: [
      {
        type: "bar",
        data: data.map((item) => ({
          value: item.valor,
          itemStyle: {
            color: getIndicatorBarColor(theme, indicator, item.valor, barGradient),
          },
        })),
        barMaxWidth: theme.style.barMaxWidth.indicator,
        itemStyle: { borderRadius: theme.style.barRadius },
        markLine: createMetaLine(
          theme,
          indicator.meta,
          `${theme.text.targetUpper} ${formatValue(indicator.meta, indicator.unit, theme.format)}`,
        ),
      },
      {
        type: "line",
        data: data.map((item) => item.valor),
        smooth: theme.style.smooth,
        connectNulls: true,
        symbolSize: theme.style.dotRadius + 2,
        lineStyle: {
          color: theme.colors.brandDeep,
          width: theme.style.lineWidth,
        },
        itemStyle: {
          color: theme.colors.brandDeep,
        },
      },
    ],
  });

  chartManager.render(chartId, container, option);
}
