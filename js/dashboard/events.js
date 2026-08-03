export function bindDashboardEvents(refs, state) {
  refs.content.addEventListener("click", (event) => {
    const tempoButton = event.target.closest("[data-tempo-view]");
    if (tempoButton) {
      state.setTempoView(tempoButton.dataset.tempoView);
      return;
    }

    const indicatorTrigger = event.target.closest("[data-indicator-id]");
    if (indicatorTrigger) {
      state.selectIndicator(indicatorTrigger.dataset.indicatorId);
    }
  });

  refs.content.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const row = event.target.closest("[data-row-indicator-id]");
    if (!row) {
      return;
    }

    event.preventDefault();
    state.selectIndicator(row.dataset.rowIndicatorId);
  });
}
