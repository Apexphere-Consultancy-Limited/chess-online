import type { LobbyChallenge } from '../../types/lobby'

interface ChallengeCardProps {
  challenge: LobbyChallenge
  isIncoming: boolean
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
  actionDisabled?: boolean
  cancelDisabled?: boolean
}

function ChallengeCard({
  challenge,
  isIncoming,
  onAccept,
  onDecline,
  onCancel,
  actionDisabled,
  cancelDisabled,
}: ChallengeCardProps) {
  const opponentProfile = isIncoming ? challenge.challenger_profile : challenge.challenged_profile
  const opponentName = opponentProfile?.username ?? 'Opponent'
  const message = challenge.message
  const createdAt = new Date(challenge.created_at)
  const formattedTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const lobbyLabel = challenge.lobby?.title ?? 'Lobby'
  const statusLabel = (() => {
    if (challenge.status === 'pending') return 'Waiting for opponent'
    if (challenge.status === 'accepted') return 'Accepted'
    if (challenge.status === 'declined') return 'Declined'
    if (challenge.status === 'expired') return 'Expired'
    if (challenge.status === 'cancelled') return 'Cancelled'
    return challenge.status
  })()

  return (
    <article id={`challenge-${challenge.id}`} className={`challenge-card challenge-card--${challenge.status}`}>
      <header className="challenge-card__header">
        <h3>{opponentName}</h3>
        <span className="challenge-card__lobby">{lobbyLabel}</span>
      </header>
      <p className="challenge-card__message">
        {isIncoming ? 'Challenged you' : 'You challenged'} · {formattedTime}
      </p>
      {message && <p className="challenge-card__note">{message}</p>}
      <footer className="challenge-card__footer">
        {challenge.status === 'pending' && isIncoming ? (
          <>
            <button type="button" className="challenge-card__button challenge-card__button--primary" onClick={onAccept} disabled={actionDisabled}>
              Accept
            </button>
            <button type="button" className="challenge-card__button" onClick={onDecline} disabled={actionDisabled}>
              Decline
            </button>
          </>
        ) : challenge.status === 'pending' && !isIncoming && onCancel ? (
          <button
            type="button"
            className="challenge-card__button challenge-card__button--danger"
            onClick={onCancel}
            disabled={cancelDisabled}
          >
            Cancel Challenge
          </button>
        ) : (
          <span className={`challenge-card__status challenge-card__status--${challenge.status}`}>
            {statusLabel}
          </span>
        )}
      </footer>
    </article>
  )
}

export default ChallengeCard
