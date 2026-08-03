export function createBaseOption(theme, option) {
  return {
    animation: true,
    color: [theme.colors.brand, theme.colors.brandDeep, theme.colors.gold],
    textStyle: {
      color: theme.colors.mutedForeground,
      fontFamily: theme.fontFamily,
    },
    ...option,
  };
}

export function createGrid(theme, overrides = {}) {
  return {
    top: theme.style.grid.top,
    right: theme.style.grid.right,
    bottom: theme.style.grid.bottom,
    left: theme.style.grid.left,
    containLabel: theme.style.grid.containLabel,
    ...overrides,
  };
}

export function createCategoryAxis(theme, data, small = false) {
  return {
    type: "category",
    data,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: theme.colors.mutedForeground,
      fontSize: small ? theme.style.smallAxisFontSize : theme.style.axisFontSize,
    },
  };
}

export function createValueAxis(theme, overrides = {}) {
  const formatter = overrides.formatter;
  const axisOverrides = { ...overrides };
  delete axisOverrides.formatter;

  return {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      lineStyle: {
        color: theme.colors.border,
        type: "dashed",
      },
    },
    axisLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.style.smallAxisFontSize,
      formatter,
    },
    ...axisOverrides,
  };
}

export function createMetaLine(theme, value, label) {
  return {
    silent: true,
    symbol: "none",
    lineStyle: {
      color: theme.colors.gold,
      type: "dashed",
      width: theme.style.metaLineWidth,
    },
    label: {
      show: true,
      formatter: label,
      color: theme.colors.gold,
      fontSize: theme.style.smallAxisFontSize,
      fontWeight: 700,
      position: "insideEndTop",
    },
    data: [{ yAxis: value }],
  };
}
