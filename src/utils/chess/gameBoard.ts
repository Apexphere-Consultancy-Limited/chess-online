import {
  BoardState,
  PieceSymbol,
  PieceColor,
  PieceType,
  Position,
  PIECES,
  PIECE_VALUES,
} from '../../types/chess'
import { isValidMove } from './moveRules'

// ============================================================
// PIECE UTILITIES
// ============================================================

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

export function getPieceValue(piece: PieceSymbol): number {
  const pieceInfo = getPieceInfo(piece)
  if (!pieceInfo) return 0
  return PIECE_VALUES[pieceInfo.type]
}

export function createInitialBoard() {
  return [
    [PIECES.black.rook, PIECES.black.knight, PIECES.black.bishop, PIECES.black.queen, PIECES.black.king, PIECES.black.bishop, PIECES.black.knight, PIECES.black.rook],
    [PIECES.black.pawn, PIECES.black.pawn, PIECES.black.pawn, PIECES.black.pawn, PIECES.black.pawn, PIECES.black.pawn, PIECES.black.pawn, PIECES.black.pawn],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [PIECES.white.pawn, PIECES.white.pawn, PIECES.white.pawn, PIECES.white.pawn, PIECES.white.pawn, PIECES.white.pawn, PIECES.white.pawn, PIECES.white.pawn],
    [PIECES.white.rook, PIECES.white.knight, PIECES.white.bishop, PIECES.white.queen, PIECES.white.king, PIECES.white.bishop, PIECES.white.knight, PIECES.white.rook]
  ]
}

// ============================================================
// GAME STATE DETECTION
// ============================================================

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

// Get all legal moves for a specific color
export function getAllLegalMoves(color: PieceColor, boardState: BoardState, enPassantTarget?: Position | null): Array<{ from: Position; to: Position }> {
  const moves: Array<{ from: Position; to: Position }> = []

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
                  moves.push({
                    from: { row: fromRow, col: fromCol },
                    to: { row: toRow, col: toCol }
                  })
                }
              }
            }
          }
        }
      }
    }
  }

  return moves
}
