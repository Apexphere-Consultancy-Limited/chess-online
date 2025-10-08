import type { LobbySession } from '../../types/lobby'
import PlayerCard from './PlayerCard'

interface PlayerListProps {
  sessions: Array<LobbySession & { profileUsername?: string; profileRating?: number | null }>
  currentUserId?: string | null
  onChallenge: (playerId: string) => void
  challengeInFlight?: string | null
  pendingChallenges: Record<string, 'pending' | 'unavailable'>
}

function PlayerList({ sessions, currentUserId, onChallenge, challengeInFlight, pendingChallenges }: PlayerListProps) {
  if (!sessions.length) {
    return <div className="player-list__empty">No players are currently online in this lobby.</div>
  }

  return (
    <ul className="player-list" aria-live="polite">
      {sessions.map((session) => {
        const isCurrentUser = session.player_id === currentUserId
        let challengeState: 'idle' | 'pending' | 'unavailable' = 'idle'
        if (challengeInFlight === session.player_id) {
          challengeState = 'pending'
        } else if (pendingChallenges[session.player_id]) {
          challengeState = pendingChallenges[session.player_id]
        }
        return (
          <PlayerCard
            key={session.id}
            session={session}
            isCurrentUser={isCurrentUser}
            onChallenge={onChallenge}
            challengeDisabled={Boolean(challengeInFlight)}
            challengeState={challengeState}
          />
        )
      })}
    </ul>
  )
}

export default PlayerList
