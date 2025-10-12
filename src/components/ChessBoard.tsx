import { BoardState, Position } from '../types/chess'
import Square from './Square'

interface ChessBoardProps {
  boardState: BoardState
  selectedSquare: Position | null
  validMoves: Position[]
  draggedPiece: Position | null
  lastMove: { from: Position; to: Position } | null
  hintSquares: { from: Position; to: Position; rank: 'gold' }[]
  onSquareClick: (row: number, col: number) => void
  onDragStart: (row: number, col: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (row: number, col: number) => void
  onDragEnd: () => void
  playerColor?: 'white' | 'black' // For board rotation in online games
}

function ChessBoard({
  boardState,
  selectedSquare,
  validMoves,
  draggedPiece,
  lastMove,
  hintSquares,
  onSquareClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  playerColor = 'white'
}: ChessBoardProps) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

  // Rotate board for black player
  const displayBoard = playerColor === 'black'
    ? boardState.slice().reverse().map(row => row.slice().reverse())
    : boardState

  const displayFiles = playerColor === 'black' ? files.slice().reverse() : files
  const displayRanks = playerColor === 'black' ? ranks.slice().reverse() : ranks

  return (
    <div className="chess-board-wrapper">
      <div className="chess-board" id="board">
        {displayBoard.map((row, displayRowIndex) =>
          row.map((piece, displayColIndex) => {
          // Convert display indices back to actual board indices for logic
          const rowIndex = playerColor === 'black' ? 7 - displayRowIndex : displayRowIndex
          const colIndex = playerColor === 'black' ? 7 - displayColIndex : displayColIndex
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
          const isLastMoveFrom =
            lastMove !== null &&
            lastMove.from.row === rowIndex &&
            lastMove.from.col === colIndex
          const isLastMoveTo =
            lastMove !== null &&
            lastMove.to.row === rowIndex &&
            lastMove.to.col === colIndex

          // Check if this square is a hint square
          let hintRank: 'gold' | null = null
          for (const hint of hintSquares) {
            if ((hint.from.row === rowIndex && hint.from.col === colIndex) ||
                (hint.to.row === rowIndex && hint.to.col === colIndex)) {
              hintRank = hint.rank
              break
            }
          }

          return (
            <div key={`${rowIndex}-${colIndex}`} className="square-wrapper">
              <Square
                row={rowIndex}
                col={colIndex}
                piece={piece}
                isLight={isLight}
                isSelected={isSelected}
                isValidMove={isValidMove}
                isDragging={isDragging}
                isLastMoveFrom={isLastMoveFrom}
                isLastMoveTo={isLastMoveTo}
                hintRank={hintRank}
                onClick={onSquareClick}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
              {/* Show file letter on bottom row */}
              {displayRowIndex === 7 && (
                <div className="coordinate-file">{displayFiles[displayColIndex]}</div>
              )}
              {/* Show rank number on left column */}
              {displayColIndex === 0 && (
                <div className="coordinate-rank">{displayRanks[displayRowIndex]}</div>
              )}
            </div>
          )
        })
      )}
      </div>
    </div>
  )
}

export default ChessBoard
