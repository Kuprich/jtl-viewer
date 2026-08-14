export const RUNS_CHANGED_EVENT = 'jtl:runs-changed'

export function notifyRunsChanged() {
  window.dispatchEvent(new Event(RUNS_CHANGED_EVENT))
}