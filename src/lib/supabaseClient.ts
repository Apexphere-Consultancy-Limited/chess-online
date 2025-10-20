import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // This warning helps during local dev; production should set envs in Vercel
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase environment variables missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')

// TypeScript types for database tables
export type Profile = {
  id: string
  username: string
  avatar_url?: string
  elo_rating: number
  games_played: number
  games_won: number
  games_drawn: number
  games_lost: number
  created_at: string
  updated_at: string
}

export type Game = {
  id: string
  white_player_id: string
  black_player_id: string
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned'
  current_fen: string
  current_turn: 'white' | 'black'
  result?: 'white_win' | 'black_win' | 'draw' | 'abandoned'
  winner_id?: string
  termination_type?: 'checkmate' | 'resignation' | 'timeout' | 'draw_agreement' | 'stalemate' | 'insufficient_material'
  white_ready?: boolean
  black_ready?: boolean
  ready_expires_at?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export type Move = {
  id: string
  game_id: string
  player_id: string
  move_number: number
  from_square: string
  to_square: string
  piece: string
  captured_piece?: string
  promotion?: string
  san_notation: string
  fen_after: string
  created_at: string
}

