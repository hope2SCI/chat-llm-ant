<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { theme as antdTheme } from 'ant-design-vue'
import ChatView from './views/ChatView.vue'
import { useSystemTheme } from './composables/useSystemTheme'
import { useThemeStore } from './stores/theme'

useSystemTheme()

const themeStore = useThemeStore()

const configTheme = computed(() => ({
  token: {
    colorPrimary: '#1677ff',
  },
  algorithm: themeStore.resolvedIsDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
}))

watchEffect(() => {
  const themeName = themeStore.resolvedIsDark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = themeName
  document.documentElement.setAttribute('data-theme', themeName)
})
</script>

<template>
  <a-config-provider :theme="configTheme">
    <ChatView />
  </a-config-provider>
</template>
