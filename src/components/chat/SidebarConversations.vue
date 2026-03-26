<template>
  <div class="sidebar" :class="{ collapsed }">
    <div class="sidebarHeader" :class="{ collapsed }">
      <a-button type="text" size="small" class="headerIconBtn" @click="emit('toggle-collapse')">
        <MenuUnfoldOutlined v-if="collapsed" />
        <MenuFoldOutlined v-else />
      </a-button>

      <a-button v-if="!collapsed" type="text" size="small" class="headerIconBtn" @click="chatStore.createConversation('新对话')">
        <PlusOutlined />
      </a-button>
    </div>

    <div v-if="!collapsed" class="sidebarList">
      <div v-if="conversations.length === 0">
        </div>

      <div v-else class="list">
        <div
          v-for="c in conversations"
          :key="c.id"
          class="item"
          :class="{ active: c.id === chatStore.selectedConversationId }"
          @click="chatStore.selectConversation(c.id)"
        >
          <div class="itemTop">
            <div class="itemTitle">{{ c.title }}</div>
            <div class="itemMeta">{{ formatTime(c.updatedAt) }}</div>
          </div>

          <div class="itemPreview">{{ buildPreview(c) }}</div>

          <div class="itemActions" @click.stop>
            <a-popconfirm
              title="确认删除该对话吗？"
              ok-text="删除"
              cancel-text="取消"
              placement="bottomRight"
              @confirm="onDeleteConversation(c.id)"
            >
              <a-button type="text" size="small" class="moreBtn" @click.stop>
                <EllipsisOutlined />
              </a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EllipsisOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PlusOutlined } from '@ant-design/icons-vue'
import type { Conversation } from '../../types/chat'
import { useChatStore } from '../../stores/chat'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-collapse'): void
}>()

const chatStore = useChatStore()

const conversations = computed(() => chatStore.conversations)
const collapsed = computed(() => props.collapsed)

function formatTime(ts: number) {
  try {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return ''
  }
}

function buildPreview(c: Conversation) {
  const last = c.messages[c.messages.length - 1]
  if (!last) return '暂无消息'
  return `${last.role === 'user' ? '你' : '助手'}：${truncate(last.content, 18)}`
}

function truncate(s: string, n: number) {
  const t = (s ?? '').trim()
  if (t.length <= n) return t || '…'
  return `${t.slice(0, n)}…`
}

async function onDeleteConversation(conversationId: string) {
  await chatStore.deleteConversation(conversationId)
}
</script>

<style scoped>
.sidebar {
  width: 292px;
  border-right: 1px solid var(--chat-divider);
  background: var(--chat-sidebar-bg);
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: width 0.2s ease;
}

.sidebar.collapsed {
  width: 62px;
}

.sidebarHeader {
  padding: 10px 8px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.sidebarHeader.collapsed {
  justify-content: center;
}

.headerIconBtn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--chat-text-secondary);
}

.headerIconBtn:hover {
  color: var(--chat-text-primary);
  background: var(--chat-item-hover);
}

.sidebarList {
  padding: 0 8px 8px 8px;
  overflow: auto;
  min-height: 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  position: relative;
  padding: 10px 10px 30px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.item:hover {
  background: var(--chat-item-hover);
  border-color: var(--chat-item-border);
}

.item.active {
  background: var(--chat-item-active-bg);
  border-color: var(--chat-item-active-border);
}

.itemTop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.itemTitle {
  font-weight: 600;
  color: var(--chat-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.itemMeta {
  font-size: 12px;
  color: var(--chat-text-tertiary);
}

.itemPreview {
  margin-top: 6px;
  font-size: 12px;
  color: var(--chat-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 20px;
}

.itemActions {
  position: absolute;
  right: 6px;
  bottom: 4px;
}

.moreBtn {
  color: var(--chat-text-tertiary);
}

.moreBtn:hover {
  color: var(--chat-text-primary);
  background: var(--chat-item-hover);
}

.item.active .moreBtn {
  color: var(--chat-text-secondary);
}
</style>
