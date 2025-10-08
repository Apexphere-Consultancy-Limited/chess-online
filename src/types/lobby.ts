import type { Profile } from '../lib/supabaseClient'

export type LobbyVisibility = 'public' | 'private'
export type LobbySessionStatus = 'available' | 'in_game'
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'

export interface Lobby {
  id: string
  slug: string
  title: string
  visibility: LobbyVisibility
  min_elo: number | null
  max_elo: number | null
  time_control?: string | null
}

export interface LobbySession {
  id: string
  lobby_id: string
  player_id: string
  status: LobbySessionStatus
  last_seen: string
  created_at: string
  lobby?: Lobby
  profile?: Profile
}

export interface LobbyChallenge {
  id: string
  lobby_id: string
  challenger_id: string
  challenged_id: string
  status: ChallengeStatus
  message?: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  lobby?: Lobby
  challenger_profile?: Profile
  challenged_profile?: Profile
}

export type NotificationType =
  | 'challenge_received'
  | 'challenge_accepted'
  | 'challenge_declined'
  | 'challenge_cancelled'
  | 'game_ready'

export interface NotificationPayload {
  lobbySlug?: string
  challengeId?: string
  gameId?: string
  challengerId?: string
  challengerUsername?: string
  opponentId?: string
  opponentUsername?: string
  message?: string | null
}

export interface LobbyNotification {
  id: string
  recipient_id: string
  type: NotificationType
  payload: NotificationPayload
  read_at: string | null
  created_at: string
}
