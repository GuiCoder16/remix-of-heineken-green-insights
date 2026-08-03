export class ChartManager {
  constructor(settings = {}, dependencies = {}) {
    this.echarts = dependencies.echarts || globalThis.echarts;
    this.theme = settings.theme || null;
    this.renderer = settings.renderer || "canvas";
    this.instances = new Map();
    this.containers = new Map();
    this.releaseAutoResize = null;
  }

  isAvailable() {
    return Boolean(this.echarts && typeof this.echarts.init === "function");
  }

  requireLibrary() {
    if (!this.isAvailable()) {
      throw new Error("Apache ECharts was not loaded. Check the CDN script in index.html.");
    }
  }

  register(chartId, container, initOptions = {}) {
    this.requireLibrary();

    if (!container) {
      throw new Error(`Chart container not found for "${chartId}".`);
    }

    const existing = this.get(chartId);
    if (existing) {
      return existing;
    }

    const chart = this.echarts.init(container, this.theme, {
      renderer: this.renderer,
      ...initOptions,
    });

    this.instances.set(chartId, chart);
    this.containers.set(chartId, container);
    container.classList?.add("has-chart");
    return chart;
  }

  create(chartId, container, option = {}, initOptions = {}) {
    this.register(chartId, container, initOptions);
    return this.update(chartId, option);
  }

  get(chartId) {
    return this.instances.get(chartId) || null;
  }

  update(chartId, option, updateOptions = {}) {
    const chart = this.get(chartId);

    if (!chart) {
      throw new Error(`Chart "${chartId}" has not been registered.`);
    }

    chart.setOption(option, {
      notMerge: true,
      lazyUpdate: false,
      ...updateOptions,
    });

    return chart;
  }

  render(chartId, container, option, updateOptions = {}) {
    this.register(chartId, container);
    return this.update(chartId, option, updateOptions);
  }

  resize(chartId) {
    const chart = this.get(chartId);

    if (chart) {
      chart.resize();
    }
  }

  resizeAll() {
    this.instances.forEach((chart) => chart.resize());
  }

  bindAutoResize(target = globalThis.window) {
    if (!target || typeof target.addEventListener !== "function") {
      return () => {};
    }

    const onResize = () => this.resizeAll();
    target.addEventListener("resize", onResize);
    this.releaseAutoResize = () => target.removeEventListener("resize", onResize);
    return this.releaseAutoResize;
  }

  linearGradient(stops, coordinates = {}) {
    this.requireLibrary();

    const gradientCoordinates = {
      x0: 0,
      y0: 0,
      x1: 0,
      y1: 1,
      ...coordinates,
    };

    return new this.echarts.graphic.LinearGradient(
      gradientCoordinates.x0,
      gradientCoordinates.y0,
      gradientCoordinates.x1,
      gradientCoordinates.y1,
      stops,
    );
  }

  dispose(chartId) {
    const chart = this.get(chartId);
    const container = this.containers.get(chartId);

    if (chart) {
      chart.dispose();
      this.instances.delete(chartId);
      this.containers.delete(chartId);
      container?.classList?.remove("has-chart");
    }
  }

  disposeAll() {
    this.instances.forEach((chart) => chart.dispose());
    this.containers.forEach((container) => container?.classList?.remove("has-chart"));
    this.instances.clear();
    this.containers.clear();

    if (this.releaseAutoResize) {
      this.releaseAutoResize();
      this.releaseAutoResize = null;
    }
  }
}

export function createChartManager(settings, dependencies = {}) {
  return new ChartManager(settings, dependencies);
}
