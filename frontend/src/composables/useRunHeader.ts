import { reactive } from 'vue'

export interface RunHeaderState {
  title: string
  meta: string | null
  settingsOpen: boolean
  exportOpen: boolean
}

const state = reactive<RunHeaderState>({
  title: '',
  meta: null,
  settingsOpen: false,
  exportOpen: false,
})

export function useRunHeader() {
  function openSettings() {
    state.settingsOpen = true
  }

  function openExport() {
    state.exportOpen = true
  }

  function reset() {
    state.title = ''
    state.meta = null
    state.settingsOpen = false
    state.exportOpen = false
  }

  return { state, openSettings, openExport, reset }
}
