import type { LobbySession } from '../../types/lobby'

interface PlayerCardProps {
  session: LobbySession & { profileUsername?: string; profileRating?: number | null }
  isCurrentUser: boolean
  onChallenge: (playerId: string) => void
  challengeDisabled?: boolean
  challengeState?: 'idle' | 'pending' | 'unavailable'
}

function PlayerCard({
  session,
  isCurrentUser,
  onChallenge,
  challengeDisabled,
  challengeState = 'idle',
}: PlayerCardProps) {
  const displayName = isCurrentUser ? 'You' : session.profileUsername ?? 'Player'
  const rating = session.profileRating ?? 'Unrated'
  const statusLabel = session.status === 'in_game' ? 'In game' : 'Available'

  let actionLabel = 'Challenge'
  if (challengeState === 'pending') actionLabel = 'Pending...'
  if (challengeState === 'unavailable') actionLabel = 'Pending'
  if (session.status === 'in_game') actionLabel = 'Busy'

  return (
    <li className="player-card">
      <div className="player-card__info">
        <div className="player-card__name">
          <span>{displayName}</span>
          {isCurrentUser && <span className="player-card__tag">You</span>}
        </div>
        <div className="player-card__meta">
          <span>{typeof rating === 'number' ? `ELO ${rating}` : rating}</span>
          <span className={`player-card__status player-card__status--${session.status}`}>{statusLabel}</span>
        </div>
      </div>
      <div className="player-card__actions">
        <button
          type="button"
          className="player-card__button"
          onClick={() => onChallenge(session.player_id)}
          disabled={
            isCurrentUser ||
            challengeDisabled ||
            session.status === 'in_game' ||
            challengeState === 'pending' ||
            challengeState === 'unavailable'
          }
        >
          {actionLabel}
        </button>
      </div>
    </li>
  )
}

export default PlayerCard
