import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme_mode'

function readStoredMode(): ThemeMode {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return 'system'
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: readStoredMode() as ThemeMode,
    systemIsDark: false,
  }),
  getters: {
    resolvedIsDark(state): boolean {
      return state.mode === 'dark' || (state.mode === 'system' && state.systemIsDark)
    },
  },
  actions: {
    setMode(mode: ThemeMode) {
      this.mode = mode
      localStorage.setItem(STORAGE_KEY, mode)
    },
    setSystemIsDark(isDark: boolean) {
      this.systemIsDark = isDark
    },
  },
})

