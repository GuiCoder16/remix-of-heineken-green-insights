import { formatMinutes } from "../formatters.js";
import { buildMonthlyTimeData } from "../metrics.js";
import {
  createBaseOption,
  createCategoryAxis,
  createGrid,
  createMetaLine,
  createTheme,
  createTooltip,
  createValueAxis,
  tooltipBlock,
  tooltipTitle,
  tooltipValue,
} from "./common/index.js";

export function renderInventoryMonthlyChart(chartManager, container, params) {
  const { chartId, config, data, meta } = params;
  const theme = createTheme(config);
  const monthlyTime = buildMonthlyTimeData(data);
  const option = createBaseOption(theme, {
    grid: createGrid(theme, { right: theme.style.grid.compactRight }),
    tooltip: createTooltip(theme, (items) => {
      const point = Array.isArray(items) ? items[0] : items;
      const payload = monthlyTime[point.dataIndex];
      return tooltipBlock(theme, [
        tooltipTitle(payload.label),
        tooltipValue(payload.display),
      ]);
    }),
    xAxis: createCategoryAxis(theme, monthlyTime.map((item) => item.label), true),
    yAxis: createValueAxis(theme, {
      formatter: (value) => formatMinutes(value),
    }),
    series: [
      {
        type: "bar",
        data: monthlyTime.map((item) => ({
          value: item.minutes,
          itemStyle: {
            color: item.minutes <= meta ? theme.colors.brand : theme.colors.destructiveMixed,
          },
        })),
        barMaxWidth: theme.style.barMaxWidth.monthlyTime,
        itemStyle: { borderRadius: theme.style.monthlyBarRadius },
        markLine: createMetaLine(theme, meta, theme.text.targetMonthlyTime),
      },
    ],
  });

  chartManager.render(chartId, container, option);
}
