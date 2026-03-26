<template>
  <a-layout style="min-height: 100svh">
    <a-layout-header class="header">
      <div class="headerInner">
        <div class="brand">Chat LLM Ant</div>
        <a-segmented
          v-model:value="mode"
          :options="options"
          size="middle"
        />
      </div>
    </a-layout-header>

    <a-layout-content class="content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import type { ThemeMode } from '../stores/theme'
import { computed } from 'vue'
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

const options = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'system' },
] as const

const mode = computed({
  get: () => themeStore.mode,
  set: (v: ThemeMode) => themeStore.setMode(v),
})
</script>

<style scoped>
.header {
  color: #fff;
  font-weight: 600;
  padding: 0 24px;
  line-height: 64px;
}

.headerInner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.brand {
  font-weight: 700;
}

.content {
  padding: 16px;
}
</style>

