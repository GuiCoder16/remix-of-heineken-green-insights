export function getChartContainer(refs, chartId) {
  const container = refs.content.querySelector(`[data-chart="${chartId}"]`);

  if (!container) {
    throw new Error(`Chart container not found: ${chartId}`);
  }

  return container;
}

export function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

export function setHtml(element, value) {
  if (element) {
    element.innerHTML = value;
  }
}
