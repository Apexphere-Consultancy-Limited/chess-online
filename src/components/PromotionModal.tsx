import { PieceColor, PieceType, PIECES } from '../types/chess'

interface PromotionModalProps {
  color: PieceColor
  onSelect: (pieceType: PieceType) => void
}

function PromotionModal({ color, onSelect }: PromotionModalProps) {
  const promotionOptions: PieceType[] = ['queen', 'rook', 'bishop', 'knight']

  return (
    <div className="promotion-modal">
      <div className="promotion-dialog">
        <h2 className="promotion-title">Choose Promotion Piece</h2>
        <div className="promotion-buttons">
          {promotionOptions.map((pieceType) => (
            <button
              key={pieceType}
              className="promotion-btn"
              onClick={() => onSelect(pieceType)}
            >
              {PIECES[color][pieceType]}
              <span className="piece-name">
                {pieceType.charAt(0).toUpperCase() + pieceType.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PromotionModal
