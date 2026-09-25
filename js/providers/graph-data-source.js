export class GraphDataSource {
  constructor(settings, dependencies = {}) {
    this.endpoint = settings.endpoint;
    this.fallbackUrls = settings.fallbackUrls || [];
    this.request = settings.request || {};
    this.scopes = settings.scopes || [];
    this.fetchImpl = dependencies.fetchImpl || globalThis.fetch?.bind(globalThis);
  }

  async load(_options = {}) {
    throw new Error("Graph data source is a placeholder and has not been implemented yet.");
  }
}
