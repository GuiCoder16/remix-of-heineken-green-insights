import { buildInventoryData } from "../metrics.js";
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

export function renderInventoryDailyChart(chartManager, container, params) {
  const { chartId, config, data, meta } = params;
  const theme = createTheme(config);
  const inventory = buildInventoryData(data);
  const option = createBaseOption(theme, {
    grid: createGrid(theme, { right: theme.style.grid.compactRight }),
    tooltip: createTooltip(theme, (items) => {
      const point = Array.isArray(items) ? items[0] : items;
      const payload = inventory[point.dataIndex];
      return tooltipBlock(theme, [
        tooltipTitle(payload.label),
        tooltipMetric(theme.text.execution, `${payload.val}${theme.format.percentSuffix}`),
      ]);
    }),
    xAxis: createCategoryAxis(theme, inventory.map((item) => item.label), true),
    yAxis: createValueAxis(theme, {
      min: theme.style.domains.inventory[0],
      max: theme.style.domains.inventory[1],
      formatter: (value) => `${value}${theme.format.percentSuffix}`,
    }),
    series: [
      {
        type: "bar",
        data: inventory.map((item) => ({
          value: item.val,
          itemStyle: {
            color: item.val >= meta ? theme.colors.brand : theme.colors.destructive,
          },
        })),
        itemStyle: { borderRadius: theme.style.smallBarRadius },
        markLine: createMetaLine(theme, meta, theme.text.targetInventory),
      },
    ],
  });

  chartManager.render(chartId, container, option);
}
