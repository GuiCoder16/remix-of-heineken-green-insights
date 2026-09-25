import { bindDashboardEvents as bindEvents } from "./dashboard/events.js";
import { renderDashboardLayout } from "./dashboard/layout.js";
import { renderAppShell as renderShell, renderError as renderShellError, renderLoading as renderShellLoading } from "./dashboard/shell.js";
import { renderDashboardCharts as renderCharts, updateDashboardState as updateState } from "./dashboard/updates.js";

export function renderAppShell(root, config) {
  return renderShell(root, config);
}

export function renderLoading(refs) {
  renderShellLoading(refs);
}

export function renderError(refs, error) {
  renderShellError(refs, error);
}

export function bindDashboardEvents(refs, state) {
  bindEvents(refs, state);
}

export function renderDashboard(refs, state, config) {
  renderDashboardLayout(refs, state, config);
}

export function updateDashboardState(refs, state, config) {
  updateState(refs, state, config);
}

export function renderDashboardCharts(refs, state, chartManager, config, previousState = null) {
  renderCharts(refs, state, chartManager, config, previousState);
}
