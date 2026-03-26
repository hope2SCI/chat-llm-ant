<template>
  <div class="chatPage">
    <SidebarConversations :collapsed="sidebarCollapsed" @toggle-collapse="toggleSidebarCollapse" />

    <div class="main">
      <div class="mainHeader">
        <div>
          <div class="mainTitle">
            {{ selectedConversation?.title ?? '未选择会话' }}
          </div>
          <div class="mainMeta">
            {{ selectedConversation ? `${selectedConversation.messages.length} 条消息` : '准备开始对话' }}
          </div>
        </div>

        <div class="headerActions">
          <a-select v-model:value="mode" size="small" class="themeSelect" :options="themeOptions" />

          <a-dropdown :trigger="['click']" placement="bottomRight">
            <a-button type="text" class="headerSettingBtn" title="对话设置">
              <SettingOutlined />
            </a-button>

            <template #overlay>
              <a-menu>
                <a-menu-item key="clear" danger @click="onClearAllConversations">
                  清空数据
                </a-menu-item>
                <a-menu-item key="setting" @click="openSettingsModal">
                  设置
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>

      <MessageList
        :messages="messages"
        :is-generating="chatStore.isGenerating"
        :streaming-assistant-message-id="chatStore.streamingAssistantMessageId"
      />

      <Composer />
    </div>

    <a-modal
      v-model:open="settingsModalOpen"
      title="对话设置"
      ok-text="保存"
      cancel-text="取消"
      @ok="onSaveSettings"
    >
      <div class="settingGroup">
        <div class="settingLabel">自动滚动到底部</div>
        <a-switch v-model:checked="settings.autoScroll" />
      </div>

      <div class="settingGroup">
        <div class="settingLabel">发送键行为</div>
        <a-radio-group v-model:value="settings.sendKeyMode">
          <a-radio value="enter">Enter 发送</a-radio>
          <a-radio value="ctrlEnter">Ctrl+Enter 发送</a-radio>
        </a-radio-group>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { ThemeMode } from '../stores/theme'
import { computed, onMounted, ref } from 'vue'
import { message as antMessage, Modal } from 'ant-design-vue'
import { SettingOutlined } from '@ant-design/icons-vue'
import { useChatStore } from '../stores/chat'
import { useThemeStore } from '../stores/theme'
import SidebarConversations from '../components/chat/SidebarConversations.vue'
import MessageList from '../components/chat/MessageList.vue'
import Composer from '../components/chat/Composer.vue'

const chatStore = useChatStore()
const themeStore = useThemeStore()

const sidebarCollapsed = ref(false)
const settingsModalOpen = ref(false)
const settings = ref({
  autoScroll: true,
  sendKeyMode: 'enter',
})

const themeOptions = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'system' },
]

const mode = computed({
  get: () => themeStore.mode,
  set: (v: ThemeMode) => themeStore.setMode(v),
})

onMounted(() => {
  void chatStore.initFromDb()
})

function toggleSidebarCollapse() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function openSettingsModal() {
  settingsModalOpen.value = true
}

async function onClearAllConversations() {
  Modal.confirm({
    title: '确认清空所有历史对话？',
    content: '该操作不可恢复。',
    okText: '清空',
    cancelText: '取消',
    okButtonProps: { danger: true },
    async onOk() {
      await chatStore.clearAllConversations()
      antMessage.success('历史对话已清空')
    },
  })
}

function onSaveSettings() {
  settingsModalOpen.value = false
  antMessage.success('设置已保存（预留）')
}

const selectedConversation = computed(() => chatStore.selectedConversation)
const messages = computed(() => selectedConversation.value?.messages ?? [])
</script>

<style scoped>
.chatPage {
  display: flex;
  height: 100svh;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.mainHeader {
  padding: 12px 16px;
  border-bottom: 1px solid var(--chat-divider);
  background: var(--chat-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mainTitle {
  font-weight: 700;
  color: var(--chat-text-primary);
}

.mainMeta {
  font-size: 12px;
  color: var(--chat-text-secondary);
  margin-top: 4px;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.themeSelect {
  width: 116px;
}

.headerSettingBtn {
  color: var(--chat-text-secondary);
}

.headerSettingBtn:hover {
  color: var(--chat-text-primary);
  background: var(--chat-item-hover);
}

.settingGroup {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.settingLabel {
  color: var(--chat-text-primary);
  font-size: 14px;
}

:deep(.ant-result) {
  margin-top: 24px;
}
</style>
