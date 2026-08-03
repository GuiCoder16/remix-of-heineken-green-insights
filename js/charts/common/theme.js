export function createTheme(config) {
  const chartConfig = config.charts;
  const colors = resolveColors(chartConfig.colors);
  const gradients = Object.fromEntries(
    Object.entries(chartConfig.gradients).map(([name, stops]) => [
      name,
      stops.map((stop) => ({
        offset: stop.offset,
        color: withOpacity(colors[stop.color], stop.opacity),
      })),
    ]),
  );

  return {
    colors,
    format: chartConfig.format,
    gradients,
    style: chartConfig.style,
    text: chartConfig.text,
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim(),
  };
}

function resolveColors(colors) {
  return Object.fromEntries(Object.entries(colors).map(([name, value]) => [name, resolveCssColor(value)]));
}

function resolveCssColor(value) {
  if (!value.startsWith("var(")) {
    return value;
  }

  const propertyName = value.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim();
}

function withOpacity(color, opacity) {
  if (opacity === undefined || color === "transparent") {
    return color;
  }

  return `color-mix(in oklab, ${color} ${opacity * 100}%, transparent)`;
}
