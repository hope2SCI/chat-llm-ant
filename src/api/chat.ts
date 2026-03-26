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

interface RequestChatCompletionStreamParams extends RequestChatCompletionParams {
  onDelta: (delta: string) => void
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

interface DeepSeekChatCompletionStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string
    }
    finish_reason?: string | null
  }>
  error?: {
    message?: string
  }
}

function getModel(params: RequestChatCompletionParams) {
  return params.model ?? import.meta.env.VITE_DEEPSEEK_MODEL ?? 'deepseek-chat'
}

function extractAssistantText(payload: DeepSeekChatCompletionResponse | null): string {
  return payload?.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function requestChatCompletion(params: RequestChatCompletionParams): Promise<string> {
  const model = getModel(params)

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

export async function requestChatCompletionStream(params: RequestChatCompletionStreamParams): Promise<void> {
  const model = getModel(params)

  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      temperature: params.temperature ?? 0.3,
      stream: true,
    }),
    signal: params.signal,
  })

  if (!resp.ok) {
    const rawText = await resp.text()
    let payload: DeepSeekChatCompletionResponse | null = null

    try {
      payload = rawText ? (JSON.parse(rawText) as DeepSeekChatCompletionResponse) : null
    } catch {
      payload = null
    }

    const reason = payload?.error?.message || rawText || `HTTP ${resp.status}`
    throw new Error(reason)
  }

  if (!resp.body) {
    throw new Error('当前环境不支持流式响应')
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || !line.startsWith('data:')) continue

      const payloadText = line.slice(5).trim()
      if (!payloadText) continue
      if (payloadText === '[DONE]') return

      let chunk: DeepSeekChatCompletionStreamChunk | null = null
      try {
        chunk = JSON.parse(payloadText) as DeepSeekChatCompletionStreamChunk
      } catch {
        chunk = null
      }

      if (!chunk) continue
      if (chunk.error?.message) {
        throw new Error(chunk.error.message)
      }
      const delta = chunk.choices?.[0]?.delta?.content
      if (delta) params.onDelta(delta)
    }
  }
}
