<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { theme as antdTheme } from 'ant-design-vue'
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
  // 让浏览器内置控件（滚动条/表单等）跟随
  document.documentElement.style.colorScheme = themeName
  document.documentElement.setAttribute('data-theme', themeName)
})
</script>

<template>
  <a-config-provider :theme="configTheme">
    <router-view />
  </a-config-provider>
</template>
