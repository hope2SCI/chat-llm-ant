import { defineStore } from 'pinia'
import { requestChatCompletionStream } from '../api/chat'
import {
  clearConversationsFromDb,
  deleteConversationFromDb,
  loadConversationsFromDb,
  loadSelectedConversationIdFromDb,
  putConversationToDb,
  saveSelectedConversationIdToDb,
} from '../db/chatDb'
import type { ChatMessage, Conversation, MessageStatus } from '../types/chat'

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function now() {
  return Date.now()
}

let abortController: AbortController | null = null
let inFlightAssistantMessageId: string | null = null

function stopInternalRequest() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  inFlightAssistantMessageId = null
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [] as Conversation[],
    selectedConversationId: null as string | null,
    isGenerating: false,
    streamingAssistantMessageId: null as string | null,
    hasLoaded: false,
  }),
  getters: {
    selectedConversation(state): Conversation | null {
      if (!state.selectedConversationId) return null
      return state.conversations.find(c => c.id === state.selectedConversationId) ?? null
    },
  },
  actions: {
    async initFromDb() {
      if (this.hasLoaded) return

      this.conversations = await loadConversationsFromDb()
      this.sortConversations()
      const selected = await loadSelectedConversationIdFromDb()

      this.selectedConversationId = this.conversations.some(c => c.id === selected)
        ? selected
        : (this.conversations[0]?.id ?? null)

      if (selected !== this.selectedConversationId) {
        await saveSelectedConversationIdToDb(this.selectedConversationId)
      }

      this.hasLoaded = true
    },

    sortConversations() {
      this.conversations.sort((a, b) => b.updatedAt - a.updatedAt)
    },

    async saveConversation(conversationId: string) {
      const conv = this.conversations.find(c => c.id === conversationId)
      if (!conv) return
      await putConversationToDb(conv)
    },

    async createConversation(initialTitle?: string) {
      const id = createId()
      const t = initialTitle ?? '新对话'

      const c: Conversation = {
        id,
        title: t,
        createdAt: now(),
        updatedAt: now(),
        messages: [],
      }

      this.conversations.unshift(c)
      this.sortConversations()
      this.selectedConversationId = id

      await putConversationToDb(c)
      await saveSelectedConversationIdToDb(this.selectedConversationId)
    },

    async selectConversation(conversationId: string) {
      if (this.isGenerating) this.stopGenerating()
      this.selectedConversationId = conversationId
      await saveSelectedConversationIdToDb(this.selectedConversationId)
    },

    async renameConversation(conversationId: string, title: string) {
      const conv = this.conversations.find(c => c.id === conversationId)
      if (!conv) return
      conv.title = title || conv.title
      conv.updatedAt = now()
      this.sortConversations()
      await this.saveConversation(conversationId)
    },

    async deleteConversation(conversationId: string) {
      if (this.isGenerating) this.stopGenerating()

      this.conversations = this.conversations.filter(c => c.id !== conversationId)
      if (this.selectedConversationId === conversationId) {
        this.selectedConversationId = this.conversations[0]?.id ?? null
      }

      await deleteConversationFromDb(conversationId)
      await saveSelectedConversationIdToDb(this.selectedConversationId)
    },

    async clearAllConversations() {
      if (this.isGenerating) this.stopGenerating()
      this.conversations = []
      this.selectedConversationId = null
      await clearConversationsFromDb()
      await saveSelectedConversationIdToDb(null)
    },

    patchAssistant(conversationId: string, assistantMessageId: string, content: string, status: MessageStatus) {
      const c = this.conversations.find(x => x.id === conversationId)
      if (!c) return
      const m = c.messages.find(x => x.id === assistantMessageId)
      if (!m) return
      m.content = content
      m.status = status
      c.updatedAt = now()
      this.sortConversations()
    },

    stopGenerating() {
      stopInternalRequest()

      if (this.streamingAssistantMessageId && this.selectedConversationId) {
        const assistantId = this.streamingAssistantMessageId
        const cId = this.selectedConversationId
        const content = this.conversations.find(c => c.id === cId)?.messages.find(m => m.id === assistantId)?.content ?? ''
        this.patchAssistant(cId, assistantId, content, 'done')
        void this.saveConversation(cId).catch(err => {
          console.error('保存会话失败', err)
        })
      }

      this.isGenerating = false
      this.streamingAssistantMessageId = null
    },

    buildApiMessages(conversationId: string) {
      const conv = this.conversations.find(c => c.id === conversationId)
      if (!conv) return []

      return conv.messages
        .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content.trim().length > 0)
        .map(m => ({ role: m.role, content: m.content }))
    },

    async sendMessage(content: string) {
      const prompt = content.trim()
      if (!prompt) return

      if (!this.selectedConversationId) {
        await this.createConversation('新对话')
      }
      if (!this.selectedConversationId) return

      this.stopGenerating()

      const conversationId = this.selectedConversationId
      const conv = this.conversations.find(c => c.id === conversationId)
      if (!conv) return

      const userMsg: ChatMessage = {
        id: createId(),
        role: 'user',
        content: prompt,
        createdAt: now(),
        status: 'done',
      }

      const assistantId = createId()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: now(),
        status: 'streaming',
      }

      conv.messages.push(userMsg, assistantMsg)
      conv.updatedAt = now()
      this.sortConversations()

      this.isGenerating = true
      this.streamingAssistantMessageId = assistantId
      inFlightAssistantMessageId = assistantId

      if (conv.title === '新对话' || !conv.title) {
        conv.title = prompt.slice(0, 18) + (prompt.length > 18 ? '...' : '')
      }

      try {
        await this.saveConversation(conversationId)
      } catch (err) {
        this.patchAssistant(conversationId, assistantId, '保存会话失败，请检查 IndexedDB 数据结构', 'done')
        this.isGenerating = false
        this.streamingAssistantMessageId = null
        inFlightAssistantMessageId = null
        const msg = err instanceof Error ? err.message : String(err)
        console.error('保存会话失败', msg)
        return
      }

      abortController = new AbortController()

      try {
        const apiMessages = this.buildApiMessages(conversationId)
        let streamedText = ''

        await requestChatCompletionStream({
          messages: apiMessages,
          signal: abortController.signal,
          onDelta: delta => {
            if (inFlightAssistantMessageId !== assistantId) return
            streamedText += delta
            this.patchAssistant(conversationId, assistantId, streamedText, 'streaming')
          },
        })

        if (inFlightAssistantMessageId !== assistantId) return

        const finalText = streamedText.trim() ? streamedText : '（空响应）'
        this.patchAssistant(conversationId, assistantId, finalText, 'done')
        await this.saveConversation(conversationId)
      } catch (err) {
        if (inFlightAssistantMessageId !== assistantId) return

        const isAbort = err instanceof DOMException && err.name === 'AbortError'
        if (!isAbort) {
          const msg = err instanceof Error ? err.message : '请求失败'
          this.patchAssistant(conversationId, assistantId, `请求失败：${msg}`, 'done')
          await this.saveConversation(conversationId)
        }
      } finally {
        if (inFlightAssistantMessageId === assistantId) {
          this.isGenerating = false
          this.streamingAssistantMessageId = null
          abortController = null
          inFlightAssistantMessageId = null
        }
      }
    },

    async regenerateLast() {
      const conv = this.selectedConversation
      if (!conv) return
      if (this.isGenerating) return

      const lastAssistant = [...conv.messages].reverse().find(m => m.role === 'assistant')
      if (!lastAssistant) return

      const assistantIndex = conv.messages.findIndex(m => m.id === lastAssistant.id)
      const priorUser = conv.messages.slice(0, assistantIndex).reverse().find(m => m.role === 'user')
      const prompt = priorUser?.content ?? ''
      if (!prompt) return

      lastAssistant.content = ''
      lastAssistant.status = 'streaming'
      conv.updatedAt = now()
      this.sortConversations()

      this.isGenerating = true
      this.streamingAssistantMessageId = lastAssistant.id
      inFlightAssistantMessageId = lastAssistant.id

      try {
        await this.saveConversation(conv.id)
      } catch (err) {
        this.patchAssistant(conv.id, lastAssistant.id, '保存会话失败，请检查 IndexedDB 数据结构', 'done')
        this.isGenerating = false
        this.streamingAssistantMessageId = null
        inFlightAssistantMessageId = null
        const msg = err instanceof Error ? err.message : String(err)
        console.error('保存会话失败', msg)
        return
      }

      abortController = new AbortController()

      try {
        const apiMessages = this.buildApiMessages(conv.id)
        let streamedText = ''

        await requestChatCompletionStream({
          messages: apiMessages,
          signal: abortController.signal,
          onDelta: delta => {
            if (inFlightAssistantMessageId !== lastAssistant.id) return
            streamedText += delta
            this.patchAssistant(conv.id, lastAssistant.id, streamedText, 'streaming')
          },
        })

        if (inFlightAssistantMessageId !== lastAssistant.id) return

        const finalText = streamedText.trim() ? streamedText : '（空响应）'
        this.patchAssistant(conv.id, lastAssistant.id, finalText, 'done')
        await this.saveConversation(conv.id)
      } catch (err) {
        if (inFlightAssistantMessageId !== lastAssistant.id) return

        const isAbort = err instanceof DOMException && err.name === 'AbortError'
        if (!isAbort) {
          const msg = err instanceof Error ? err.message : '请求失败'
          this.patchAssistant(conv.id, lastAssistant.id, `请求失败：${msg}`, 'done')
          await this.saveConversation(conv.id)
        }
      } finally {
        if (inFlightAssistantMessageId === lastAssistant.id) {
          this.isGenerating = false
          this.streamingAssistantMessageId = null
          abortController = null
          inFlightAssistantMessageId = null
        }
      }
    },
  },
})
