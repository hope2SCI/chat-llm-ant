export type ChatRole = 'user' | 'assistant'
export type MessageStatus = 'streaming' | 'done'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  status?: MessageStatus
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

