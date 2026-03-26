import { onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '../stores/theme'

export function useSystemTheme() {
  const themeStore = useThemeStore()

  let mql: MediaQueryList | null = null
  const onChange = (e: MediaQueryListEvent) => themeStore.setSystemIsDark(e.matches)

  onMounted(() => {
    mql = window.matchMedia('(prefers-color-scheme: dark)')
    themeStore.setSystemIsDark(mql.matches)
    mql.addEventListener('change', onChange)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', onChange)
  })
}

