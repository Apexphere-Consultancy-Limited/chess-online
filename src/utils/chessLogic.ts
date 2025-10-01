import {
  BoardState,
  PieceSymbol,
  PieceColor,
  PieceType,
  Position,
  PIECES,
  PIECE_VALUES,
} from '../types/chess'

export interface PieceInfo {
  type: PieceType
  color: PieceColor
  symbol: PieceSymbol
}

export function getPieceInfo(piece: PieceSymbol): PieceInfo | null {
  if (!piece) return null

  const whiteValues = Object.values(PIECES.white)
  const blackValues = Object.values(PIECES.black)

  if (whiteValues.includes(piece)) {
    const type = Object.keys(PIECES.white).find(
      (key) => PIECES.white[key as PieceType] === piece
    ) as PieceType
    return { type, color: 'white', symbol: piece }
  }

  if (blackValues.includes(piece)) {
    const type = Object.keys(PIECES.black).find(
      (key) => PIECES.black[key as PieceType] === piece
    ) as PieceType
    return { type, color: 'black', symbol: piece }
  }

  return null
}

export function isValidPawnMove(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  color: PieceColor,
  boardState: BoardState,
  enPassantTarget?: Position | null
): boolean {
  const direction = color === 'white' ? -1 : 1
  const startRow = color === 'white' ? 6 : 1

  const rowDiff = toRow - fromRow
  const colDiff = Math.abs(toCol - fromCol)

  // Forward moves
  if (colDiff === 0 && boardState[toRow][toCol] === null) {
    if (rowDiff === direction) return true
    if (
      fromRow === startRow &&
      rowDiff === 2 * direction &&
      boardState[fromRow + direction][fromCol] === null
    )
      return true
  }

  // Diagonal captures
  if (colDiff === 1 && rowDiff === direction) {
    // Normal capture
    if (boardState[toRow][toCol] !== null) {
      const targetPiece = getPieceInfo(boardState[toRow][toCol]!)
      if (targetPiece && targetPiece.color !== color) return true
    }
    // En passant
    else if (
      enPassantTarget &&
      toRow === enPassantTarget.row &&
      toCol === enPassantTarget.col
    ) {
      return true
    }
  }

  return false
}

export function isValidKnightMove(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)
}

export function isValidRookMove(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  boardState: BoardState
): boolean {
  if (fromRow !== toRow && fromCol !== toCol) return false

  const rowDir = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0
  const colDir = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0

  let currentRow = fromRow + rowDir
  let currentCol = fromCol + colDir

  while (currentRow !== toRow || currentCol !== toCol) {
    if (boardState[currentRow][currentCol] !== null) return false
    currentRow += rowDir
    currentCol += colDir
  }

  return true
}

export function isValidBishopMove(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  boardState: BoardState
): boolean {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)

  if (rowDiff !== colDiff) return false

  const rowDir = toRow > fromRow ? 1 : -1
  const colDir = toCol > fromCol ? 1 : -1

  let currentRow = fromRow + rowDir
  let currentCol = fromCol + colDir

  while (currentRow !== toRow) {
    if (boardState[currentRow][currentCol] !== null) return false
    currentRow += rowDir
    currentCol += colDir
  }

  return true
}

export function isValidQueenMove(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  boardState: BoardState
): boolean {
  return (
    isValidRookMove(fromRow, fromCol, toRow, toCol, boardState) ||
    isValidBishopMove(fromRow, fromCol, toRow, toCol, boardState)
  )
}

export function isValidKingMove(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const rowDiff = Math.abs(toRow - fromRow)
  const colDiff = Math.abs(toCol - fromCol)

  // Normal king move (1 square in any direction)
  if (rowDiff <= 1 && colDiff <= 1) {
    return true
  }

  // Castling (2 squares horizontally) - further validation in makeMove
  if (rowDiff === 0 && colDiff === 2) {
    return true
  }

  return false
}

export function isValidCastling(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  boardState: BoardState,
  hasMoved: { king: boolean; rookLeft: boolean; rookRight: boolean }
): boolean {
  // Must be on the same row
  if (fromRow !== toRow) return false

  // Must move exactly 2 squares
  const colDiff = toCol - fromCol
  if (Math.abs(colDiff) !== 2) return false

  // King must not have moved
  if (hasMoved.king) return false

  // Determine if kingside or queenside castling
  const isKingSide = colDiff > 0
  const rookCol = isKingSide ? 7 : 0

  // Rook must not have moved
  if (isKingSide && hasMoved.rookRight) return false
  if (!isKingSide && hasMoved.rookLeft) return false

  // Check if rook exists
  const rook = boardState[fromRow][rookCol]
  if (!rook) return false
  const rookInfo = getPieceInfo(rook)
  if (!rookInfo || rookInfo.type !== 'rook') return false

  // Path must be clear between king and rook
  const start = Math.min(fromCol, rookCol)
  const end = Math.max(fromCol, rookCol)
  for (let col = start + 1; col < end; col++) {
    if (boardState[fromRow][col] !== null) return false
  }

  return true
}

export function isValidMove(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  boardState: BoardState,
  enPassantTarget?: Position | null
): boolean {
  const piece = boardState[fromRow][fromCol]
  if (!piece) return false

  const pieceInfo = getPieceInfo(piece)
  if (!pieceInfo) return false

  // Check if destination has same color piece
  const targetPiece = boardState[toRow][toCol]
  if (targetPiece) {
    const targetInfo = getPieceInfo(targetPiece)
    if (targetInfo && targetInfo.color === pieceInfo.color) {
      return false
    }
  }

  // Validate move based on piece type
  switch (pieceInfo.type) {
    case 'pawn':
      return isValidPawnMove(fromRow, fromCol, toRow, toCol, pieceInfo.color, boardState, enPassantTarget)
    case 'knight':
      return isValidKnightMove(fromRow, fromCol, toRow, toCol)
    case 'rook':
      return isValidRookMove(fromRow, fromCol, toRow, toCol, boardState)
    case 'bishop':
      return isValidBishopMove(fromRow, fromCol, toRow, toCol, boardState)
    case 'queen':
      return isValidQueenMove(fromRow, fromCol, toRow, toCol, boardState)
    case 'king':
      return isValidKingMove(fromRow, fromCol, toRow, toCol)
    default:
      return false
  }
}

export function getValidMoves(
  row: number,
  col: number,
  boardState: BoardState,
  enPassantTarget?: Position | null
): Position[] {
  const validMoves: Position[] = []

  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isValidMove(row, col, toRow, toCol, boardState, enPassantTarget)) {
        validMoves.push({ row: toRow, col: toCol })
      }
    }
  }

  return validMoves
}

export function getPieceValue(piece: PieceSymbol): number {
  const pieceInfo = getPieceInfo(piece)
  if (!pieceInfo) return 0
  return PIECE_VALUES[pieceInfo.type]
}

// Find the king position for a given color
export function findKingPosition(boardState: BoardState, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col]
      if (piece) {
        const pieceInfo = getPieceInfo(piece)
        if (pieceInfo && pieceInfo.type === 'king' && pieceInfo.color === color) {
          return { row, col }
        }
      }
    }
  }
  return null
}

// Check if a square is under attack by the opponent
export function isSquareUnderAttack(
  row: number,
  col: number,
  attackerColor: PieceColor,
  boardState: BoardState
): boolean {
  // Check all opponent pieces to see if they can attack this square
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = boardState[fromRow][fromCol]
      if (piece) {
        const pieceInfo = getPieceInfo(piece)
        if (pieceInfo && pieceInfo.color === attackerColor) {
          // For pawns, check diagonal attacks only (not forward moves)
          if (pieceInfo.type === 'pawn') {
            const direction = attackerColor === 'white' ? -1 : 1
            const rowDiff = row - fromRow
            const colDiff = Math.abs(col - fromCol)
            if (rowDiff === direction && colDiff === 1) {
              return true
            }
          } else {
            // For other pieces, use normal move validation
            if (isValidMove(fromRow, fromCol, row, col, boardState)) {
              return true
            }
          }
        }
      }
    }
  }
  return false
}

// Check if the king is in check
export function isInCheck(color: PieceColor, boardState: BoardState): boolean {
  const kingPos = findKingPosition(boardState, color)
  if (!kingPos) return false

  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white'
  return isSquareUnderAttack(kingPos.row, kingPos.col, opponentColor, boardState)
}

// Check if a move would leave the king in check
export function wouldBeInCheck(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  boardState: BoardState
): boolean {
  const piece = boardState[fromRow][fromCol]
  if (!piece) return false

  const pieceInfo = getPieceInfo(piece)
  if (!pieceInfo) return false

  // Simulate the move
  const newBoard = boardState.map(row => [...row])
  newBoard[toRow][toCol] = piece
  newBoard[fromRow][fromCol] = null

  return isInCheck(pieceInfo.color, newBoard)
}

// Check if the current player has any legal moves
export function hasLegalMoves(color: PieceColor, boardState: BoardState, enPassantTarget?: Position | null): boolean {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = boardState[fromRow][fromCol]
      if (piece) {
        const pieceInfo = getPieceInfo(piece)
        if (pieceInfo && pieceInfo.color === color) {
          // Check all possible destination squares
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(fromRow, fromCol, toRow, toCol, boardState, enPassantTarget)) {
                // Check if this move would leave the king in check
                if (!wouldBeInCheck(fromRow, fromCol, toRow, toCol, boardState)) {
                  return true
                }
              }
            }
          }
        }
      }
    }
  }
  return false
}

// Check if it's checkmate
export function isCheckmate(color: PieceColor, boardState: BoardState, enPassantTarget?: Position | null): boolean {
  return isInCheck(color, boardState) && !hasLegalMoves(color, boardState, enPassantTarget)
}

// Check if it's stalemate
export function isStalemate(color: PieceColor, boardState: BoardState, enPassantTarget?: Position | null): boolean {
  return !isInCheck(color, boardState) && !hasLegalMoves(color, boardState, enPassantTarget)
}
