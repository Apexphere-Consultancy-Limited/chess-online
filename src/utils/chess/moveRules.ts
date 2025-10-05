/**
 * Chess Move Validation Rules
 * Contains all logic for validating if a move is legal
 */

import {
  BoardState,
  PieceColor,
  PieceSymbol,
  Position,
} from '../../types/chess'
import { getPieceInfo } from './gameBoard'

// ============================================================================
// PIECE-SPECIFIC MOVEMENT RULES
// ============================================================================

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
  // Note: Castling (2 squares) is validated separately in isValidCastling
  return rowDiff <= 1 && colDiff <= 1
}

// ============================================================================
// SPECIAL MOVE VALIDATION
// ============================================================================

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

// ============================================================================
// GENERAL MOVE VALIDATION
// ============================================================================

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

// ============================================================================
// MOVE EXECUTION
// ============================================================================

export interface MoveExecutionResult {
  newBoard: BoardState
  capturedPiece: PieceSymbol | null
  isCastling: boolean
  isEnPassant: boolean
}

/**
 * Executes a chess move on the board (without validation)
 * Handles special moves: castling, en passant
 */
export function executeMove(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  boardState: BoardState,
  enPassantTarget: Position | null,
  isCastling: boolean
): MoveExecutionResult {
  const piece = boardState[fromRow][fromCol]
  const pieceInfo = getPieceInfo(piece!)

  // Copy the board
  const newBoard = boardState.map((row) => [...row])
  let capturedPiece = newBoard[toRow][toCol]

  // Move the piece
  newBoard[toRow][toCol] = piece
  newBoard[fromRow][fromCol] = null

  // Handle castling - move the rook too
  if (isCastling) {
    const isKingSide = toCol > fromCol
    const rookFromCol = isKingSide ? 7 : 0
    const rookToCol = isKingSide ? toCol - 1 : toCol + 1
    const rook = newBoard[fromRow][rookFromCol]
    newBoard[fromRow][rookToCol] = rook
    newBoard[fromRow][rookFromCol] = null
  }

  let isEnPassant = false

  // Handle en passant capture
  if (
    pieceInfo?.type === 'pawn' &&
    enPassantTarget &&
    toRow === enPassantTarget.row &&
    toCol === enPassantTarget.col &&
    !capturedPiece
  ) {
    const capturedPawnRow = pieceInfo.color === 'white' ? toRow + 1 : toRow - 1
    capturedPiece = newBoard[capturedPawnRow][toCol]
    newBoard[capturedPawnRow][toCol] = null
    isEnPassant = true
  }

  return {
    newBoard,
    capturedPiece,
    isCastling,
    isEnPassant,
  }
}
