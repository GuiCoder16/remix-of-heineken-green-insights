export function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}:${String(remainingMinutes).padStart(2, "0")}`;
}

export function formatValue(value, unit, formatConfig) {
  if (value === null || Number.isNaN(value)) {
    return formatConfig.emptyValue;
  }

  if (unit === "pct") {
    return `${value.toFixed(1)}${formatConfig.percentSuffix}`;
  }

  if (unit === "time") {
    return formatMinutes(value);
  }

  if (unit === "money") {
    return value.toLocaleString(formatConfig.locale, {
      style: "currency",
      currency: formatConfig.currency,
      maximumFractionDigits: 0,
    });
  }

  return value.toLocaleString(formatConfig.locale, { maximumFractionDigits: 2 });
}

export function formatAxisValue(value, unit, formatConfig) {
  if (unit === "pct") {
    return `${value}${formatConfig.percentSuffix}`;
  }

  if (unit === "money") {
    return `${Math.round(value / 1000)}${formatConfig.thousandSuffix}`;
  }

  if (unit === "time") {
    return formatMinutes(value);
  }

  return String(value);
}
