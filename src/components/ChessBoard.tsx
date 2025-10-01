import { BoardState, Position } from '../types/chess'
import Square from './Square'

interface ChessBoardProps {
  boardState: BoardState
  selectedSquare: Position | null
  validMoves: Position[]
  draggedPiece: Position | null
  onSquareClick: (row: number, col: number) => void
  onDragStart: (row: number, col: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (row: number, col: number) => void
  onDragEnd: () => void
}

function ChessBoard({
  boardState,
  selectedSquare,
  validMoves,
  draggedPiece,
  onSquareClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: ChessBoardProps) {
  return (
    <div className="chess-board" id="board">
      {boardState.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isLight = (rowIndex + colIndex) % 2 === 0
          const isSelected =
            selectedSquare !== null &&
            selectedSquare.row === rowIndex &&
            selectedSquare.col === colIndex
          const isValidMove = validMoves.some(
            (move) => move.row === rowIndex && move.col === colIndex
          )
          const isDragging =
            draggedPiece !== null &&
            draggedPiece.row === rowIndex &&
            draggedPiece.col === colIndex

          return (
            <Square
              key={`${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              piece={piece}
              isLight={isLight}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isDragging={isDragging}
              onClick={onSquareClick}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
          )
        })
      )}
    </div>
  )
}

export default ChessBoard
