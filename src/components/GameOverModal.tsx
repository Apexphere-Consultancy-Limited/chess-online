import { PieceColor } from '../types/chess'

interface GameOverModalProps {
  winner: PieceColor | 'draw'
  reason: string
  onReset: () => void
}

export default function GameOverModal({ winner, reason, onReset }: GameOverModalProps) {
  const isDraw = winner === 'draw'
  const winnerText = isDraw ? 'Draw!' : `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`
  const subtitle = isDraw ? `Game ended in ${reason}` : `Victory by ${reason}`

  // Create fireworks elements
  const fireworks = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="firework"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#6bcf7f'][Math.floor(Math.random() * 5)]
      }}
    />
  ))

  return (
    <div className="victory-overlay">
      <div className="fireworks-container">
        {fireworks}
      </div>
      {!isDraw && (
        <div className="victory-trophy">
          🏆
        </div>
      )}
      <div className="victory-message">
        {winnerText}
        <div style={{ fontSize: '24px', marginTop: '15px', opacity: 0.9 }}>
          {subtitle}
        </div>
      </div>
      <button onClick={onReset} className="play-again-btn">
        Play Again
      </button>
    </div>
  )
}
