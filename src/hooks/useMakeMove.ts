import { supabase } from '../lib/supabaseClient'

export async function makeMove(
  gameId: string,
  from: string,
  to: string,
  promotion?: string
) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(
    `${supabaseUrl}/functions/v1/validate-move`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ gameId, from, to, promotion })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to make move')
  }

  return response.json()
}

export async function resignGame(gameId: string) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(
    `${supabaseUrl}/functions/v1/resign-game`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ gameId })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to resign game')
  }

  return response.json()
}

export async function playerReady(gameId: string) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(
    `${supabaseUrl}/functions/v1/player-ready`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ gameId })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to mark ready')
  }

  return response.json()
}
