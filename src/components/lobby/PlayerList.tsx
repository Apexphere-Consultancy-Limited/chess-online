import type { LobbySession } from '../../types/lobby'
import PlayerCard from './PlayerCard'

interface PlayerListProps {
  sessions: Array<LobbySession & { profileUsername?: string; profileRating?: number | null }>
  currentUserId?: string | null
  onChallenge: (playerId: string) => void
  onCancelChallenge?: (challengeId: string) => void
  challengeInFlight?: string | null
  pendingChallenges: Record<string, { status: 'pending' | 'unavailable'; challengeId: string }>
  cancellingId?: string | null
}

function PlayerList({ sessions, currentUserId, onChallenge, onCancelChallenge, challengeInFlight, pendingChallenges, cancellingId }: PlayerListProps) {
  const otherPlayers = sessions.filter((session) => session.player_id !== currentUserId)

  if (otherPlayers.length === 0) {
    return <div className="player-list__empty">No other players are currently online in this lobby.</div>
  }

  return (
    <ul className="player-list" aria-live="polite">
      {otherPlayers.map((session) => {
        const isCurrentUser = false
        const pendingChallenge = pendingChallenges[session.player_id]
        let challengeState: 'idle' | 'pending' | 'unavailable' = 'idle'
        let challengeId: string | undefined

        if (challengeInFlight === session.player_id) {
          challengeState = 'pending'
        } else if (pendingChallenge) {
          challengeState = pendingChallenge.status
          challengeId = pendingChallenge.challengeId
        }

        return (
          <PlayerCard
            key={session.id}
            session={session}
            isCurrentUser={isCurrentUser}
            onChallenge={onChallenge}
            onCancelChallenge={onCancelChallenge}
            challengeDisabled={Boolean(challengeInFlight)}
            challengeState={challengeState}
            challengeId={challengeId}
            cancellingChallenge={cancellingId === challengeId}
          />
        )
      })}
    </ul>
  )
}

export default PlayerList
