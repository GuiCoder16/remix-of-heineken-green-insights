export class JsonFileDataSource {
  constructor(settings, dependencies = {}) {
    this.url = settings.url;
    this.fallbackUrls = settings.fallbackUrls || [];
    this.request = settings.request || {};
    this.fetchImpl = dependencies.fetchImpl || globalThis.fetch?.bind(globalThis);
  }

  async load() {
    if (typeof this.fetchImpl !== "function") {
      throw new Error("Fetch API is not available in this browser.");
    }

    const candidates = [this.url, ...this.fallbackUrls].filter(Boolean);
    const failures = [];

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
