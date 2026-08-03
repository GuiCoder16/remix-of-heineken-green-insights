export class GraphDataSource {
  constructor(settings, dependencies = {}) {
    this.endpoint = settings.endpoint;
    this.request = settings.request || {};
    this.scopes = settings.scopes || [];
    this.fetchImpl = dependencies.fetchImpl || globalThis.fetch?.bind(globalThis);
  }

  async load() {
    throw new Error("Graph data source is a placeholder and is not configured yet.");
  }
}
