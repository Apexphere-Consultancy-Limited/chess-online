import { PieceSymbol, PieceColor } from '../types/chess'
import { PieceIcon } from './PieceIcon'

interface CapturedPiecesProps {
  color: PieceColor
  capturedPieces: PieceSymbol[]
  score: number
}

function CapturedPieces({ color, capturedPieces, score }: CapturedPiecesProps) {
  const displayColor = color === 'white' ? 'White' : 'Black'

  return (
    <div className="captured-pieces">
      <h3>{displayColor}</h3>
      <div className="captured-list">
        {capturedPieces.length > 0 ? (
          capturedPieces.map((piece, index) => (
            <span key={index} className="captured-piece">
              <PieceIcon piece={piece} />
            </span>
          ))
        ) : (
          <span className="no-captures">No captures yet</span>
        )}
      </div>
      <div className="score-display">
        <div className="points">+{score}</div>
      </div>
    </div>
  )
}

export default CapturedPieces
