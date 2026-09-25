const REQUIRED_ARRAYS = Object.freeze([
  "months",
  "tempoDiario",
  "acuracidadeDiaria",
  "inventarioDiario",
  "tempoMensalMin",
  "indicators",
]);

const REQUIRED_METAS = Object.freeze(["tempoDia", "acuracidade", "inventarioDia", "tempoMes"]);
const REQUIRED_INDICATOR_FIELDS = Object.freeze(["id", "name", "group", "unit", "direction", "meta", "ytd", "monthly"]);
const REQUIRED_INDICATORS = Object.freeze(["desvios", "auditoria_5s"]);
const VALID_UNITS = Object.freeze(["pct", "money", "num", "time"]);
const VALID_DIRECTIONS = Object.freeze(["higher", "lower"]);

export class DashboardDataError extends Error {
  constructor(issues) {
    super(formatDashboardDataError(issues));
    this.name = "DashboardDataError";
    this.issues = Object.freeze([...issues]);
  }
}

export function assertDashboardData(data) {
  const issues = [];

  if (!isRecord(data)) {
    throw new DashboardDataError(["raiz deve ser um objeto."]);
  }

  validateRequiredArrays(data, issues);
  validateMonths(data.months, issues);
  validateMetas(data.metas, issues);
  validateMonthlyNumbers("tempoMensalMin", data.tempoMensalMin, data.months?.length, issues);
  validateIndicators(data.indicators, data.months?.length, issues);
  validateDailySeries("tempoDiario", "minutes", data.tempoDiario, issues);
  validateDailySeries("acuracidadeDiaria", "val", data.acuracidadeDiaria, issues);
  validateDailySeries("inventarioDiario", "val", data.inventarioDiario, issues);

  if (issues.length > 0) {
    throw new DashboardDataError(issues);
  }

  return data;
}

function validateRequiredArrays(data, issues) {
  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(data[key])) {
      issues.push(`${key} deve ser array.`);
    }
  }
}

function validateMonths(months, issues) {
  if (!Array.isArray(months)) {
    return;
  }

  if (months.length === 0) {
    issues.push("months deve ser array não vazio.");
    return;
  }

  const seen = new Set();

  months.forEach((month, index) => {
    if (!isNonEmptyString(month)) {
      issues.push(`months[${index}] deve ser string não vazia.`);
      return;
    }

    const normalized = month.trim();
    if (seen.has(normalized)) {
      issues.push(`months possui mês duplicado: '${normalized}'.`);
    }

    seen.add(normalized);
  });
}

function validateMetas(metas, issues) {
  if (!isRecord(metas)) {
    issues.push("metas deve ser objeto.");
    return;
  }

  for (const key of REQUIRED_METAS) {
    if (!Number.isFinite(metas[key])) {
      issues.push(`metas.${key} deve ser número finito.`);
    }
  }
}

function validateMonthlyNumbers(fieldName, values, expectedLength, issues) {
  if (!Array.isArray(values)) {
    return;
  }

  validateExpectedLength(fieldName, values, expectedLength, issues);

  values.forEach((value, index) => {
    if (!Number.isFinite(value)) {
      issues.push(`${fieldName}[${index}] deve ser número finito.`);
    }
  });
}

function validateIndicators(indicators, expectedLength, issues) {
  if (!Array.isArray(indicators)) {
    return;
  }

  if (indicators.length === 0) {
    issues.push("indicators deve ser array não vazio.");
    return;
  }

  const ids = new Set();

  indicators.forEach((indicator, index) => {
    if (!isRecord(indicator)) {
      issues.push(`indicators[${index}] deve ser objeto.`);
      return;
    }

    validateIndicatorFields(indicator, index, expectedLength, issues);

    if (!isNonEmptyString(indicator.id)) {
      return;
    }

    if (ids.has(indicator.id)) {
      issues.push(`id de indicador duplicado: '${indicator.id}'.`);
    }

    ids.add(indicator.id);
  });

  for (const requiredId of REQUIRED_INDICATORS) {
    if (!ids.has(requiredId)) {
      issues.push(`indicador obrigatório '${requiredId}' não encontrado.`);
    }
  }
}

function validateIndicatorFields(indicator, index, expectedLength, issues) {
  const label = getIndicatorLabel(indicator, index);

  for (const field of REQUIRED_INDICATOR_FIELDS) {
    if (!hasOwn(indicator, field)) {
      issues.push(`${label} não possui campo obrigatório '${field}'.`);
    }
  }

  validateTextField(label, "id", indicator.id, issues);
  validateTextField(label, "name", indicator.name, issues);
  validateTextField(label, "group", indicator.group, issues);

  if (!VALID_UNITS.includes(indicator.unit)) {
    issues.push(`${label} possui unit inválido: '${String(indicator.unit)}'.`);
  }

  if (!VALID_DIRECTIONS.includes(indicator.direction)) {
    issues.push(`${label} possui direction inválido: '${String(indicator.direction)}'.`);
  }

  if (!Number.isFinite(indicator.meta)) {
    issues.push(`${label} possui meta inválido; esperado número finito.`);
  }

  if (indicator.ytd !== null && !Number.isFinite(indicator.ytd)) {
    issues.push(`${label} possui ytd inválido; esperado número finito ou null.`);
  }

  if (!Array.isArray(indicator.monthly)) {
    issues.push(`${label} possui monthly inválido; esperado array.`);
    return;
  }

  validateExpectedLength(`${label} monthly`, indicator.monthly, expectedLength, issues);

  indicator.monthly.forEach((value, monthlyIndex) => {
    if (value !== null && !Number.isFinite(value)) {
      issues.push(`${label} possui monthly[${monthlyIndex}] inválido; esperado número finito ou null.`);
    }
  });
}

function validateTextField(label, field, value, issues) {
  if (!isNonEmptyString(value)) {
    issues.push(`${label} possui ${field} inválido; esperado string não vazia.`);
  }
}

function validateDailySeries(fieldName, valueField, rows, issues) {
  if (!Array.isArray(rows)) {
    return;
  }

  const days = new Set();

  rows.forEach((row, index) => {
    if (!isRecord(row)) {
      issues.push(`${fieldName}[${index}] deve ser objeto.`);
      return;
    }

    if (!Number.isInteger(row.day) || row.day <= 0) {
      issues.push(`${fieldName}[${index}].day deve ser inteiro positivo.`);
    } else if (days.has(row.day)) {
      issues.push(`${fieldName} possui day duplicado: ${row.day}.`);
    } else {
      days.add(row.day);
    }

    if (!Number.isFinite(row[valueField])) {
      issues.push(`${fieldName}[${index}].${valueField} deve ser número finito.`);
    }
  });
}

function validateExpectedLength(fieldName, values, expectedLength, issues) {
  if (!Number.isInteger(expectedLength)) {
    return;
  }

  if (values.length !== expectedLength) {
    issues.push(`${fieldName} deve possuir ${expectedLength} valores, mas recebeu ${values.length}.`);
  }
}

function getIndicatorLabel(indicator, index) {
  return isNonEmptyString(indicator.id) ? `indicator '${indicator.id}'` : `indicators[${index}]`;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function formatDashboardDataError(issues) {
  if (issues.length === 1) {
    return `DashboardData inválido: ${issues[0]}`;
  }

  return `DashboardData inválido:\n${issues.map((issue) => `- ${issue}`).join("\n")}`;
}
