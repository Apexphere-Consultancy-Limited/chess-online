import type { LobbyChallenge } from '../../types/lobby'
import ChallengeCard from './ChallengeCard'

interface ChallengePanelProps {
  incoming: LobbyChallenge[]
  onAccept: (challengeId: string) => void
  onDecline: (challengeId: string) => void
  respondingTo?: string | null
}

function ChallengePanel({ incoming, onAccept, onDecline, respondingTo }: ChallengePanelProps) {
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
    </div>
  )
}

export default ChallengePanel
