<template>
  <div class="row" :class="message.role === 'user' ? 'user' : 'assistant'">
    <a-avatar :size="28" class="avatar">
      <template #icon>
        <component :is="message.role === 'user' ? UserOutlined : RobotOutlined" />
      </template>
    </a-avatar>

    <div class="bubble">
      <div class="markdownBody" v-html="renderedHtml"></div>
      <span v-if="isStreaming && message.role === 'assistant'" class="cursor">▍</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { ChatMessage as ChatMessageType } from '../../types/chat'
import { RobotOutlined, UserOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  message: ChatMessageType
  isStreaming: boolean
}>()

const isStreaming = computed(() => props.isStreaming && props.message.role === 'assistant')

const renderedHtml = computed(() => {
  const source = props.message.content || (isStreaming.value ? '正在生成…' : '')
  const parsed = marked.parse(source, {
    breaks: true,
    gfm: true,
    async: false,
  })
  const rawHtml = typeof parsed === 'string' ? parsed : ''
  return DOMPurify.sanitize(rawHtml)
})
</script>

<style scoped>
.row {
  display: flex;
  gap: 10px;
  padding: 8px 0;
}

.row.user {
  justify-content: flex-end;
}

.row.user .avatar {
  order: 2;
}

.row.user .bubble {
  order: 1;
  background: var(--chat-user-bubble-bg);
  border-color: var(--chat-user-bubble-border);
}

.avatar {
  flex: 0 0 auto;
  background: var(--chat-avatar-bg);
  color: var(--chat-text-secondary);
}

.bubble {
  max-width: 780px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--chat-assistant-bubble-bg);
  border: 1px solid var(--chat-assistant-bubble-border);
  color: var(--chat-text-primary);
}

.markdownBody {
  word-break: break-word;
  line-height: 1.6;
}

.markdownBody :deep(p) {
  margin: 0;
}

.markdownBody :deep(p + p) {
  margin-top: 10px;
}

.markdownBody :deep(ul),
.markdownBody :deep(ol) {
  margin: 8px 0 0;
  padding-left: 20px;
}

.markdownBody :deep(pre) {
  margin: 10px 0 0;
  background: var(--chat-code-bg);
  color: var(--chat-code-text);
  border-radius: 10px;
  border: 1px solid var(--chat-code-border);
  padding: 10px 12px;
  overflow-x: auto;
}

.markdownBody :deep(code) {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
}

.markdownBody :deep(:not(pre) > code) {
  background: var(--chat-inline-code-bg);
  border-radius: 6px;
  padding: 2px 5px;
}

.markdownBody :deep(blockquote) {
  margin: 10px 0 0;
  border-left: 3px solid var(--chat-blockquote-border);
  padding: 2px 0 2px 10px;
  color: var(--chat-text-secondary);
}

.markdownBody :deep(a) {
  color: var(--chat-link);
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s steps(2, jump-none) infinite;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
