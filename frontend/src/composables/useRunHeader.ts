import { reactive } from 'vue'

export interface RunHeaderState {
  title: string
  meta: string | null
  settingsOpen: boolean
}

const state = reactive<RunHeaderState>({
  title: '',
  meta: null,
  settingsOpen: false,
})

export function useRunHeader() {
  function openSettings() {
    state.settingsOpen = true
  }

  function reset() {
    state.title = ''
    state.meta = null
    state.settingsOpen = false
  }

  return { state, openSettings, reset }
}
