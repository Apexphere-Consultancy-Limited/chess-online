import { supabase } from '../lib/supabaseClient'

export async function createGame(opponentUsername: string) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  const response = await fetch(
    `${supabaseUrl}/functions/v1/create-game`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ opponentUsername })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create game')
  }

  return response.json()
}
