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
      color: theme.colors.brandDeep,
      fontFamily: theme.fontFamily,
    },
    formatter,
  };
}

export function tooltipBlock(theme, rows) {
  return `<div style="color:${theme.colors.brandDeep}">${rows.join("")}</div>`;
}

export function tooltipTitle(label) {
  return `<div style="font-size:12px;font-weight:700;margin-bottom:4px">${label}</div>`;
}

export function tooltipMetric(label, value) {
  return `<div style="display:flex;gap:12px;justify-content:space-between;font-family:var(--font-mono);font-size:13px"><span>${label}</span><strong>${value}</strong></div>`;
}

export function tooltipValue(value) {
  return `<div style="font-family:var(--font-mono);font-size:18px;color:var(--brand);font-weight:500">${value}</div>`;
}

export function tooltipMuted(text) {
  return `<div style="font-size:11px;color:var(--muted-foreground);margin-top:2px">${text}</div>`;
}
