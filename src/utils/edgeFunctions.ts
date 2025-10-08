import { supabase } from '../lib/supabaseClient'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

export type EdgeMethod = 'POST' | 'PATCH' | 'DELETE'

interface CallEdgeOptions {
  method?: EdgeMethod
  keepalive?: boolean
}

export async function callEdgeFunction<T>(
  endpoint: string,
  body?: Record<string, unknown>,
  options: CallEdgeOptions = {},
) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const method = options.method ?? 'POST'

  const response = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
    keepalive: options.keepalive ?? false,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const payload = await response.json()
      message = payload.error ?? payload.message ?? message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}
