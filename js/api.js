import { ApiDataSource } from "./providers/api-data-source.js";
import { GraphDataSource } from "./providers/graph-data-source.js";
import { JsonFileDataSource } from "./providers/json-file-data-source.js";

const PROVIDERS = Object.freeze({
  api: ApiDataSource,
  graph: GraphDataSource,
  jsonFile: JsonFileDataSource,
});

export class DataService {
  constructor(dataSource) {
    if (!dataSource || typeof dataSource.load !== "function") {
      throw new TypeError("DataService requires a data source with a load() method.");
    }

    this.dataSource = dataSource;
    this.cache = null;
  }

  async getDashboardData(options = {}) {
    if (this.cache && !options.forceRefresh) {
      return this.cache;
    }

    const data = await this.dataSource.load(options);
    assertDashboardData(data);
    this.cache = data;
    return data;
  }

  clearCache() {
    this.cache = null;
  }
}

export function createDataService(config, dependencies = {}) {
  return new DataService(createDataSource(config.data, dependencies));
}

export function createDataSource(dataConfig, dependencies = {}) {
  const providerName = dataConfig.provider;
  const Provider = PROVIDERS[providerName];

  if (!Provider) {
    throw new Error(`Unsupported data provider: ${providerName}`);
  }

  const providerSettings = dataConfig.providers[providerName];

  if (!providerSettings) {
    throw new Error(`Missing settings for data provider: ${providerName}`);
  }

  return new Provider(providerSettings, dependencies);
}

function assertDashboardData(data) {
  const requiredArrays = [
    "months",
    "tempoDiario",
    "acuracidadeDiaria",
    "inventarioDiario",
    "tempoMensalMin",
    "indicators",
  ];

  if (!data || typeof data !== "object") {
    throw new Error("Dashboard data must be an object.");
  }

  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      throw new Error(`Dashboard data is missing array "${key}".`);
    }
  }

  if (!data.metas || typeof data.metas !== "object") {
    throw new Error('Dashboard data is missing object "metas".');
  }
}
