<template>
  <div ref="listRef" class="messageList">
    <div style="flex: 1;display:flex; align-items:center;justify-content: center;" v-if="messages.length === 0">
      <div style="color:#aaa;text-align: center;">
        没有对话记录<br /><br />
      输入内容并发送以开始新对话
      </div>
    </div>

    <div v-else class="messages">
      <ChatMessage
        v-for="m in messages"
        :key="m.id"
        :message="m"
        :is-streaming="m.id === streamingAssistantMessageId && isGenerating"
      />
    </div>

    <div ref="bottomRef" class="bottomAnchor" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ChatMessage as ChatMessageType } from '../../types/chat'
import ChatMessage from './ChatMessage.vue'

const props = defineProps<{
  messages: ChatMessageType[]
  isGenerating: boolean
  streamingAssistantMessageId: string | null
}>()

const listRef = ref<HTMLDivElement | null>(null)
const bottomRef = ref<HTMLDivElement | null>(null)

const emptyText = computed(() => '开始一段对话吧')

const shouldAutoScroll = ref(true)

function updateAutoScrollFlag() {
  const el = listRef.value
  if (!el) return
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  shouldAutoScroll.value = distanceFromBottom < 260
}

function scrollToBottom(behavior: ScrollBehavior = 'auto') {
  nextTick(() => {
    bottomRef.value?.scrollIntoView({ behavior, block: 'end' })
  })
}

onMounted(() => {
  updateAutoScrollFlag()
  listRef.value?.addEventListener('scroll', updateAutoScrollFlag, { passive: true })
})

onBeforeUnmount(() => {
  listRef.value?.removeEventListener('scroll', updateAutoScrollFlag)
})

watch(
  () => {
    const streamingId = props.streamingAssistantMessageId
    const streamingContentLen = streamingId ? props.messages.find(m => m.id === streamingId)?.content.length ?? 0 : 0
    return `${props.messages.length}|${streamingId ?? ''}|${streamingContentLen}|${props.isGenerating}`
  },
  () => {
    if (!shouldAutoScroll.value) return
    scrollToBottom(props.isGenerating ? 'auto' : 'smooth')
  }
)
</script>

<style scoped>
.messageList {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 16px 0;
  background: var(--chat-surface);
}

.messages {
  display: flex;
  flex-direction: column;
}

.bottomAnchor {
  height: 1px;
}
</style>

