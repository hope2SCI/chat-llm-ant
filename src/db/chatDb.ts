import Dexie, { type Table } from 'dexie'
import type { Conversation } from '../types/chat'

interface ChatMetaRecord {
  key: 'selectedConversationId'
  value: string | null
}

class ChatDatabase extends Dexie {
  conversations!: Table<Conversation, string>
  meta!: Table<ChatMetaRecord, string>

  constructor() {
    super('chat_llm_ant_db')

    this.version(1).stores({
      conversations: '&id, updatedAt, createdAt',
      meta: '&key',
    })
  }
}

export const chatDb = new ChatDatabase()

function normalizeConversation(conversation: Conversation): Conversation {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: Number(conversation.createdAt),
    updatedAt: Number(conversation.updatedAt),
    messages: conversation.messages.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: Number(message.createdAt),
      status: message.status,
    })),
  }
}

export async function loadConversationsFromDb() {
  return chatDb.conversations.orderBy('updatedAt').reverse().toArray()
}

export async function putConversationToDb(conversation: Conversation) {
  await chatDb.conversations.put(normalizeConversation(conversation))
}

export async function bulkPutConversationsToDb(conversations: Conversation[]) {
  await chatDb.conversations.bulkPut(conversations.map(normalizeConversation))
}

export async function deleteConversationFromDb(conversationId: string) {
  await chatDb.conversations.delete(conversationId)
}

export async function clearConversationsFromDb() {
  await chatDb.conversations.clear()
}

export async function loadSelectedConversationIdFromDb() {
  const row = await chatDb.meta.get('selectedConversationId')
  return row?.value ?? null
}

export async function saveSelectedConversationIdToDb(selectedConversationId: string | null) {
  await chatDb.meta.put({
    key: 'selectedConversationId',
    value: selectedConversationId,
  })
}
