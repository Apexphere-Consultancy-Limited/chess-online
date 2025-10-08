import { PieceSymbol } from '../types/chess'
import { PieceIcon } from './PieceIcon'

interface SquareProps {
  row: number
  col: number
  piece: PieceSymbol | null
  isLight: boolean
  isSelected: boolean
  isValidMove: boolean
  isDragging: boolean
  isLastMoveFrom: boolean
  isLastMoveTo: boolean
  hintRank: 'gold' | null
  onClick: (row: number, col: number) => void
  onDragStart: (row: number, col: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (row: number, col: number) => void
  onDragEnd: () => void
}

function Square({
  row,
  col,
  piece,
  isLight,
  isSelected,
  isValidMove,
  isDragging,
  isLastMoveFrom,
  isLastMoveTo,
  hintRank,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: SquareProps) {
  const squareClass = `square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''} ${isLastMoveFrom || isLastMoveTo ? 'last-move' : ''} ${hintRank ? `hint-${hintRank}` : ''}`

  const handleDragStart = (e: React.DragEvent) => {
    // Set the drag effect to 'move' to remove the plus icon
    e.dataTransfer.effectAllowed = 'move'

    onDragStart(row, col)
  }

  return (
    <div
      className={squareClass}
      data-row={row}
      data-col={col}
      onClick={() => onClick(row, col)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(row, col)}
    >
      {piece && (
        <div
          className={`piece ${isDragging ? 'dragging' : ''}`}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
        >
          <PieceIcon piece={piece} />
        </div>
      )}
    </div>
  )
}

export default Square
