export class ApiDataSource {
  constructor(settings, dependencies = {}) {
    this.endpoint = settings.endpoint;
    this.fallbackUrls = settings.fallbackUrls || [];
    this.request = settings.request || {};
    this.fetchImpl = dependencies.fetchImpl || globalThis.fetch?.bind(globalThis);
  }

  async load(_options = {}) {
    if (typeof this.fetchImpl !== "function") {
      throw new Error("Fetch API is not available in this browser.");
    }

    const candidates = [this.endpoint, ...this.fallbackUrls].filter(Boolean);
    const failures = [];

    if (candidates.length === 0) {
      throw new Error("API data source requires an endpoint.");
    }

    for (const candidate of candidates) {
      try {
        const response = await this.fetchImpl(candidate, this.request);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} while loading ${candidate}`);
        }

        return await response.json();
      } catch (error) {
        failures.push(formatLoadFailure(candidate, error));
      }
    }

    throw new Error(`Unable to load dashboard data.\n${failures.join("\n")}`);
  }
}

function formatLoadFailure(candidate, error) {
  const message = error instanceof Error ? error.message : String(error);
  return `- ${candidate}: ${message}`;
}
