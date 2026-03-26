<template>
  <div class="wrap">
    <a-result
      status="404"
      title="页面不存在"
      sub-title="请检查路由地址后重试。"
    >
      <template #extra>
        <a-button type="primary" @click="goHome">返回首页</a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/home')
}
</script>

<style scoped>
.wrap {
  max-width: 520px;
  margin: 48px auto;
}
</style>

