import { AppConfig } from "./config.js";
import { createDataService } from "./api.js";
import { createDashboardState } from "./state.js";
import { createChartManager } from "./charts.js";
import {
  bindDashboardEvents,
  renderAppShell,
  renderDashboard,
  renderDashboardCharts,
  renderError,
  renderLoading,
  updateDashboardState,
} from "./dashboard.js";

document.addEventListener("DOMContentLoaded", () => {
  bootstrap().catch((error) => {
    const root = document.querySelector("#app");
    const refs = root ? renderAppShell(root, AppConfig) : null;

    if (refs) {
      renderError(refs, error);
    } else {
      console.error(error);
    }
  });
});

async function bootstrap() {
  const root = document.querySelector("#app");

  if (!root) {
    throw new Error('Root element "#app" was not found.');
  }

  const refs = renderAppShell(root, AppConfig);
  const state = createDashboardState({
    selectedIndicatorId: AppConfig.dashboard.defaultIndicatorId,
    tempoView: AppConfig.dashboard.defaultTempoView,
  });
  const dataService = createDataService(AppConfig);
  const chartManager = createChartManager(AppConfig.charts);
  let dashboardMounted = false;

  bindDashboardEvents(refs, state);
  state.subscribe((nextState, previousState) => {
    if (nextState.isLoading) {
      renderLoading(refs);
      return;
    }

    if (nextState.error) {
      renderError(refs, nextState.error);
      return;
    }

    if (nextState.data) {
      try {
        if (!dashboardMounted || !previousState.data || previousState.data !== nextState.data) {
          renderDashboard(refs, nextState, AppConfig);
          renderDashboardCharts(refs, nextState, chartManager, AppConfig);
          dashboardMounted = true;
          return;
        }

        updateDashboardState(refs, nextState, AppConfig);
        renderDashboardCharts(refs, nextState, chartManager, AppConfig, previousState);
      } catch (error) {
        state.setError(error);
      }
    }
  });

  globalThis.HeinekenDashboard = {
    config: AppConfig,
    state,
    dataService,
    chartManager,
  };

  try {
    state.setLoading(true);
    if (chartManager.isAvailable()) {
      chartManager.bindAutoResize();
    }

    const data = await dataService.getDashboardData();
    assertDefaultIndicatorExists(data, AppConfig.dashboard.defaultIndicatorId);
    state.setData(data);
  } catch (error) {
    state.setError(error);
  }
}

function assertDefaultIndicatorExists(data, defaultIndicatorId) {
  const exists = data.indicators.some((indicator) => indicator.id === defaultIndicatorId);

  if (!exists) {
    throw new Error(`Configuração inválida: defaultIndicatorId '${defaultIndicatorId}' não existe em data.indicators.`);
  }
}
