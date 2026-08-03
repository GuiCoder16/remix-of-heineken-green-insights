const DEFAULT_STATE = Object.freeze({
  data: null,
  selectedIndicatorId: "ocupacao",
  tempoView: "bar",
  isLoading: false,
  error: null,
});

export function createDashboardState(initialState = {}) {
  let state = freezeState({ ...DEFAULT_STATE, ...initialState });
  const subscribers = new Set();

  function getState() {
    return state;
  }

  function setState(nextPatch) {
    const previousState = state;
    const patch = typeof nextPatch === "function" ? nextPatch(state) : nextPatch;
    state = freezeState({ ...state, ...patch });
    subscribers.forEach((subscriber) => subscriber(state, previousState));
    return state;
  }

  function subscribe(subscriber) {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }

  return {
    getState,
    setState,
    subscribe,
    setData(data) {
      return setState({ data, isLoading: false, error: null });
    },
    setLoading(isLoading) {
      return setState({ isLoading });
    },
    setError(error) {
      return setState({ error, isLoading: false });
    },
    selectIndicator(selectedIndicatorId) {
      if (state.selectedIndicatorId === selectedIndicatorId) {
        return state;
      }

      return setState({ selectedIndicatorId });
    },
    setTempoView(tempoView) {
      if (state.tempoView === tempoView) {
        return state;
      }

      return setState({ tempoView });
    },
  };
}

function freezeState(nextState) {
  return Object.freeze(nextState);
}
