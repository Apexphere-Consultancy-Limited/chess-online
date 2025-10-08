import type { LobbyChallenge } from '../../types/lobby'
import ChallengeCard from './ChallengeCard'

interface ChallengePanelProps {
  incoming: LobbyChallenge[]
  outgoing: LobbyChallenge[]
  onAccept: (challengeId: string) => void
  onDecline: (challengeId: string) => void
  onCancel: (challengeId: string) => void
  respondingTo?: string | null
  cancellingId?: string | null
}

function ChallengePanel({ incoming, outgoing, onAccept, onDecline, onCancel, respondingTo, cancellingId }: ChallengePanelProps) {
  return (
    <div className="challenge-panel">
      <section>
        <header className="challenge-panel__header">
          <h2>Incoming Challenges</h2>
          {incoming.length > 0 && <span className="challenge-panel__count">{incoming.length}</span>}
        </header>
        {incoming.length === 0 ? (
          <p className="challenge-panel__empty">No pending challenges right now.</p>
        ) : (
          <div className="challenge-panel__list">
            {incoming.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isIncoming
                onAccept={() => onAccept(challenge.id)}
                onDecline={() => onDecline(challenge.id)}
                actionDisabled={respondingTo === challenge.id}
              />
            ))}
          </div>
        )}
      </section>
      <section>
        <header className="challenge-panel__header">
          <h2>Your Challenges</h2>
          {outgoing.length > 0 && <span className="challenge-panel__count">{outgoing.length}</span>}
        </header>
        {outgoing.length === 0 ? (
          <p className="challenge-panel__empty">You haven&apos;t challenged anyone yet.</p>
        ) : (
          <div className="challenge-panel__list">
            {outgoing.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isIncoming={false}
                onCancel={challenge.status === 'pending' ? () => onCancel(challenge.id) : undefined}
                cancelDisabled={cancellingId === challenge.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default ChallengePanel
