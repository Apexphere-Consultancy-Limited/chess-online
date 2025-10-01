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

  return (
    <div className="victory-overlay">
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
