import { ApiDataSource } from "./providers/api-data-source.js";
import { GraphDataSource } from "./providers/graph-data-source.js";
import { JsonFileDataSource } from "./providers/json-file-data-source.js";
import { assertDashboardData } from "./validators/dashboard-data-validator.js";

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

    this.cache = assertDashboardData(await this.dataSource.load(options));
    return this.cache;
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
