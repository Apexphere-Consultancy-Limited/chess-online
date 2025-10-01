import { PieceSymbol, PieceColor } from '../types/chess'

interface CapturedPiecesProps {
  color: PieceColor
  capturedPieces: PieceSymbol[]
  score: number
}

function CapturedPieces({ color, capturedPieces, score }: CapturedPiecesProps) {
  const displayColor = color === 'white' ? 'White' : 'Black'
  const oppositeColor = color === 'white' ? 'Black' : 'White'

  return (
    <div className="captured-pieces">
      <h3>{oppositeColor}'s Captured Pieces</h3>
      <div className="captured-list">
        {capturedPieces.map((piece, index) => (
          <span key={index} className="captured-piece">{piece}</span>
        ))}
      </div>
      <div className="score-display">
        <div className="player-name">{displayColor} Score</div>
        <div className="points">{score} points</div>
      </div>
    </div>
  )
}

export default CapturedPieces
