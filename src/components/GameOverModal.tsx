import { PieceColor } from '../types/chess'

interface GameOverModalProps {
  winner: PieceColor | 'draw'
  reason: string
  onReset: () => void
  isOnline?: boolean // For online games, show "Return to Lobby" instead of "Play Again"
  playerColor?: PieceColor // For online games, to determine "You Win" vs "You Lose"
}

export default function GameOverModal({ winner, reason, onReset, isOnline = false, playerColor }: GameOverModalProps) {
  const isDraw = winner === 'draw'

  // For online games, show "You Win!" or "You Lose!"
  // For offline games, show the color that won
  let winnerText: string
  if (isDraw) {
    winnerText = 'Draw!'
  } else if (isOnline && playerColor) {
    winnerText = winner === playerColor ? 'You Win!' : 'You Lose!'
  } else {
    winnerText = `${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`
  }

  const subtitle = isDraw ? `Game ended in ${reason}` : `Victory by ${reason}`
  const buttonText = isOnline ? 'Return to Lobby' : 'Play Again'

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
        {buttonText}
      </button>
    </div>
  )
}
