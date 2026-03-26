<template>
  <div class="home">
    <a-card title="欢迎使用 Vue3 + Ant Design Vue">
      <a-space direction="vertical" :size="12">
        <a-typography-paragraph>
          当前路由：<b>{{ route.path }}</b>
        </a-typography-paragraph>

        <a-button type="primary" @click="counterStore.increment()">
          点击计数 +1（当前 {{ count }}）
        </a-button>

        <a-alert
          :message="`计数 = ${count}`"
          type="info"
          show-icon
        />
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useCounterStore } from '../stores/counter'

const route = useRoute()
const counterStore = useCounterStore()
const { count } = storeToRefs(counterStore)
</script>

<style scoped>
.home {
  max-width: 860px;
  margin: 0 auto;
}
</style>

