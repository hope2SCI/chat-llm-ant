export interface ChatCompletionRequestMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestChatCompletionParams {
  messages: ChatCompletionRequestMessage[]
  model?: string
  temperature?: number
  signal?: AbortSignal
}

interface DeepSeekChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

function extractAssistantText(payload: DeepSeekChatCompletionResponse | null): string {
  return payload?.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function requestChatCompletion(params: RequestChatCompletionParams): Promise<string> {
  const model = params.model ?? import.meta.env.VITE_DEEPSEEK_MODEL ?? 'deepseek-chat'

  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.3,
      stream: false,
    }),
    signal: params.signal,
  })

  const rawText = await resp.text()
  let payload: DeepSeekChatCompletionResponse | null = null

  try {
    payload = rawText ? (JSON.parse(rawText) as DeepSeekChatCompletionResponse) : null
  } catch {
    payload = null
  }

  if (!resp.ok) {
    const reason = payload?.error?.message || rawText || `HTTP ${resp.status}`
    throw new Error(reason)
  }

  const content = extractAssistantText(payload)
  if (!content) {
    throw new Error('DeepSeek 返回为空，请检查模型、配额或请求参数')
  }

  return content
}
