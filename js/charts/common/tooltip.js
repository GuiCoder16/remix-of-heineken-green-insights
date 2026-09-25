export function createTooltip(theme, formatter) {
  return {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
      shadowStyle: { color: theme.colors.transparent },
    },
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    padding: [8, 12],
    textStyle: {
      color: theme.colors.brand,
      fontFamily: theme.fontFamily,
    },
    formatter,
  };
}

export function tooltipBlock(theme, rows) {
  return `<div class="chart-tooltip">${rows.join("")}</div>`;
}

export function tooltipTitle(label) {
  return `<div class="chart-tooltip-title">${label}</div>`;
}

export function tooltipMetric(label, value) {
  return `<div class="chart-tooltip-metric"><span>${label}</span><strong>${value}</strong></div>`;
}

export function tooltipValue(value) {
  return `<div class="chart-tooltip-value">${value}</div>`;
}

export function tooltipMuted(text) {
  return `<div class="chart-tooltip-muted">${text}</div>`;
}
