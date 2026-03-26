<template>
  <div class="composer">
    <div class="topRow">
      <a-button
        v-if="!chatStore.isGenerating && hasLastAssistant"
        type="text"
        size="small"
        @click="chatStore.regenerateLast()"
      >
        重新生成最后一条
      </a-button>
    </div>

    <div class="inputRow">
      <a-textarea
        v-model:value="draft"
        :rows="3"
        :placeholder="chatStore.isGenerating ? '正在生成中...' : '输入消息（Enter发送，Shift+Enter换行）'"
        :disabled="chatStore.isGenerating"
        @keydown.enter.exact.prevent="onSend"
      />

      <div class="actionsInline">
        <a-button type="primary" :disabled="!canSend" @click="onSend">
          发送
        </a-button>
        <a-button v-if="chatStore.isGenerating" danger :disabled="!chatStore.isGenerating" @click="chatStore.stopGenerating()">
          停止
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChatStore } from '../../stores/chat'

const chatStore = useChatStore()
const draft = ref('')

const hasLastAssistant = computed(() => {
  const conv = chatStore.selectedConversation
  if (!conv) return false
  for (let i = conv.messages.length - 1; i >= 0; i--) {
    if (conv.messages[i].role === 'assistant') return true
  }
  return false
})

const canSend = computed(() => draft.value.trim().length > 0 && !chatStore.isGenerating)

async function onSend() {
  const content = draft.value
  if (!content.trim()) return

  try {
    await chatStore.sendMessage(content)
    draft.value = ''
  } catch (e) {
    console.error('sendMessage failed', e)
  }
}
</script>

<style scoped>
.composer {
  border-top: 1px solid var(--chat-divider);
  background: var(--chat-surface);
  padding: 12px 16px 16px;
  backdrop-filter: blur(6px);
}

:deep(.ant-input) {
  border-radius: 14px;
  background: var(--chat-input-bg);
  border-color: var(--chat-input-border);
  color: var(--chat-text-primary);
}

:deep(.ant-input::placeholder) {
  color: var(--chat-text-tertiary);
}

.topRow {
  margin-bottom: 8px;
}

.inputRow {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.inputRow :deep(.ant-input-textarea) {
  flex: 1;
}

.actionsInline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 0 auto;
}
</style>
