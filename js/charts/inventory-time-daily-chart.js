import { formatMinutes } from "../formatters.js";
import { buildDailyTimeData } from "../metrics.js";
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

export function renderDailyTimeChart(chartManager, container, params) {
  const { chartId, config, data, meta, view } = params;
  const theme = createTheme(config);
  const dailyTime = buildDailyTimeData(data);
  const option =
    view === "area"
      ? createDailyTimeAreaOption(chartManager, theme, dailyTime, meta)
      : createDailyTimeBarOption(chartManager, theme, dailyTime, meta);

  chartManager.render(chartId, container, option);
}

function createDailyTimeBarOption(chartManager, theme, dailyTime, meta) {
  const barGradient = chartManager.linearGradient(theme.gradients.brandBar);

  return createBaseOption(theme, {
    grid: createGrid(theme),
    tooltip: createDailyTimeTooltip(theme, dailyTime),
    xAxis: createCategoryAxis(theme, dailyTime.map((item) => item.label)),
    yAxis: createValueAxis(theme, {
      min: 0,
      max: meta + theme.style.domains.dailyTimePadding,
      formatter: (value) => formatMinutes(value),
    }),
    series: [
      {
        type: "bar",
        data: dailyTime.map((item) => item.minutes),
        barMaxWidth: theme.style.barMaxWidth.dailyTime,
        itemStyle: {
          color: barGradient,
          borderRadius: theme.style.barRadius,
        },
        markLine: createMetaLine(theme, meta, theme.text.targetDailyTime),
      },
    ],
  });
}

function createDailyTimeAreaOption(chartManager, theme, dailyTime, meta) {
  return createBaseOption(theme, {
    grid: createGrid(theme),
    tooltip: createDailyTimeTooltip(theme, dailyTime),
    xAxis: createCategoryAxis(theme, dailyTime.map((item) => item.label)),
    yAxis: createValueAxis(theme, {
      min: 0,
      max: meta + theme.style.domains.dailyTimePadding,
      formatter: (value) => formatMinutes(value),
    }),
    series: [
      {
        type: "line",
        data: dailyTime.map((item) => item.minutes),
        smooth: theme.style.smooth,
        symbolSize: theme.style.largeDotRadius * 2,
        lineStyle: {
          color: theme.colors.brand,
          width: theme.style.strongLineWidth,
        },
        itemStyle: {
          color: theme.colors.brand,
          borderColor: theme.colors.white,
          borderWidth: 2,
        },
        areaStyle: {
          color: chartManager.linearGradient(theme.gradients.brandArea),
        },
        markLine: createMetaLine(theme, meta, theme.text.targetDailyTime),
      },
    ],
  });
}

function createDailyTimeTooltip(theme, dailyTime) {
  return createTooltip(theme, (items) => {
    const point = Array.isArray(items) ? items[0] : items;
    const payload = dailyTime[point.dataIndex];
    return tooltipBlock(theme, [
      tooltipTitle(payload.label),
      tooltipValue(payload.display),
    ]);
  });
}
