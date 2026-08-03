export function renderAppShell(root, config) {
  root.innerHTML = `
    <main class="app-shell">
      <div class="app-container" id="dashboard-content"></div>
    </main>
  `;

  document.title = config.appName;

  return {
    content: root.querySelector("#dashboard-content"),
  };
}

export function renderLoading(refs) {
  refs.content.innerHTML = `
    <section class="status-panel loading-panel">
      <div class="loading-row" role="status">
        <span class="loading-dot" aria-hidden="true"></span>
        <h1>Carregando dados do dashboard</h1>
      </div>
      <p>Preparando a visão consolidada dos indicadores operacionais.</p>
    </section>
  `;
}

export function renderError(refs, error) {
  const message = error instanceof Error ? error.message : String(error);

  refs.content.innerHTML = `
    <section class="status-panel error-panel">
      <h1>Não foi possível iniciar a versão estática</h1>
      <p>Verifique a origem dos dados configurada para o DataService.</p>
      <pre class="error-details"></pre>
    </section>
  `;

  refs.content.querySelector(".error-details").textContent = message;
}
