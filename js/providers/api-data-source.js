export class ApiDataSource {
  constructor(settings, dependencies = {}) {
    this.endpoint = settings.endpoint;
    this.request = settings.request || {};
    this.fetchImpl = dependencies.fetchImpl || globalThis.fetch?.bind(globalThis);
  }

  async load() {
    if (typeof this.fetchImpl !== "function") {
      throw new Error("Fetch API is not available in this browser.");
    }

    if (!this.endpoint) {
      throw new Error("API data source requires an endpoint.");
    }

    const response = await this.fetchImpl(this.endpoint, this.request);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while loading ${this.endpoint}`);
    }

    return response.json();
  }
}
