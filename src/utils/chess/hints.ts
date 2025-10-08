import { BoardState, Position, PieceColor, PieceType } from '../../types/chess'
import { getValidMoves, getPieceInfo, getPieceValue, executeMove, isValidCastling, wouldBeInCheck, isInCheck, isCheckmate } from './index'

interface ScoredMove {
  from: Position
  to: Position
  score: number
}

// Piece-square tables for positional evaluation
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
]

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
]

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
]

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
]

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
]

const KING_MIDDLE_GAME_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
]

/**
 * Get positional score for a piece on a square
 */
function getPositionalScore(pieceType: PieceType, row: number, col: number, color: PieceColor): number {
  // Flip row for black pieces
  const tableRow = color === 'white' ? 7 - row : row

  switch (pieceType) {
    case 'pawn':
      return PAWN_TABLE[tableRow][col]
    case 'knight':
      return KNIGHT_TABLE[tableRow][col]
    case 'bishop':
      return BISHOP_TABLE[tableRow][col]
    case 'rook':
      return ROOK_TABLE[tableRow][col]
    case 'queen':
      return QUEEN_TABLE[tableRow][col]
    case 'king':
      return KING_MIDDLE_GAME_TABLE[tableRow][col]
    default:
      return 0
  }
}

/**
 * Evaluate the entire board position
 */
function evaluatePosition(boardState: BoardState, color: PieceColor): number {
  let score = 0
  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white'

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col]
      if (piece) {
        const pieceInfo = getPieceInfo(piece)
        if (pieceInfo) {
          const materialValue = getPieceValue(piece) * 100
          const positionalValue = getPositionalScore(pieceInfo.type, row, col, pieceInfo.color)

          if (pieceInfo.color === color) {
            score += materialValue + positionalValue
          } else {
            score -= materialValue + positionalValue
          }
        }
      }
    }
  }

  return score
}

/**
 * Count how many squares a piece controls/attacks
 */
function getMobilityScore(boardState: BoardState, color: PieceColor): number {
  let mobility = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col]
      if (piece) {
        const pieceInfo = getPieceInfo(piece)
        if (pieceInfo && pieceInfo.color === color) {
          const moves = getValidMoves(row, col, boardState, null)
          mobility += moves.length
        }
      }
    }
  }

  return mobility
}

/**
 * Evaluate king safety
 */
function getKingSafetyScore(boardState: BoardState, color: PieceColor): number {
  let safety = 0

  // Find king position
  let kingPos: Position | null = null
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col]
      if (piece) {
        const pieceInfo = getPieceInfo(piece)
        if (pieceInfo && pieceInfo.type === 'king' && pieceInfo.color === color) {
          kingPos = { row, col }
          break
        }
      }
    }
    if (kingPos) break
  }

  if (!kingPos) return 0

  // Check pawn shield
  const direction = color === 'white' ? -1 : 1
  const shieldRow = kingPos.row + direction

  if (shieldRow >= 0 && shieldRow < 8) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      const col = kingPos.col + colOffset
      if (col >= 0 && col < 8) {
        const piece = boardState[shieldRow][col]
        if (piece) {
          const pieceInfo = getPieceInfo(piece)
          if (pieceInfo && pieceInfo.type === 'pawn' && pieceInfo.color === color) {
            safety += 10
          }
        }
      }
    }
  }

  return safety
}

/**
 * Evaluates a move and returns a comprehensive score
 */
function evaluateMove(
  from: Position,
  to: Position,
  boardState: BoardState,
  enPassantTarget: Position | null,
  color: PieceColor,
  hasMoved: any
): number {
  const piece = boardState[from.row][from.col]
  const pieceInfo = getPieceInfo(piece!)
  if (!pieceInfo) return -10000

  const opponentColor: PieceColor = color === 'white' ? 'black' : 'white'

  // Check if this is a castling move
  const isCastling =
    pieceInfo.type === 'king' &&
    Math.abs(to.col - from.col) === 2 &&
    isValidCastling(from.row, from.col, to.row, to.col, boardState, hasMoved[color])

  // Execute move to see the result
  const result = executeMove(from.row, from.col, to.row, to.col, boardState, enPassantTarget, isCastling)
  const newBoard = result.newBoard

  let score = 0

  // 1. Material gain from captures (most important)
  if (result.capturedPiece) {
    const capturedValue = getPieceValue(result.capturedPiece) * 100
    const attackerValue = getPieceValue(piece!) * 100

    // Winning material is great
    score += capturedValue * 10

    // But capturing with a more valuable piece is risky
    if (attackerValue > capturedValue) {
      score -= (attackerValue - capturedValue) * 2
    }
  }

  // 2. Checkmate is the ultimate goal
  if (isCheckmate(opponentColor, newBoard, null)) {
    return 100000
  }

  // 3. Check is valuable
  if (isInCheck(opponentColor, newBoard)) {
    score += 50
  }

  // 4. Positional improvement
  const oldPositionalScore = getPositionalScore(pieceInfo.type, from.row, from.col, color)
  const newPositionalScore = getPositionalScore(pieceInfo.type, to.row, to.col, color)
  score += (newPositionalScore - oldPositionalScore) * 2

  // 5. Overall position evaluation
  const positionScore = evaluatePosition(newBoard, color)
  score += positionScore / 10

  // 6. Mobility (piece activity)
  const mobility = getMobilityScore(newBoard, color)
  score += mobility

  // 7. King safety
  const kingSafety = getKingSafetyScore(newBoard, color)
  score += kingSafety

  // 8. Castling is very good for king safety
  if (isCastling) {
    score += 60
  }

  // 9. Pawn advancement (especially passed pawns)
  if (pieceInfo.type === 'pawn') {
    const advancementRow = color === 'white' ? 7 - to.row : to.row
    score += advancementRow * 5

    // Near promotion is very valuable
    if (advancementRow >= 6) {
      score += 100
    }
  }

  // 10. Piece safety - check if moving into danger
  let isDefended = false
  let attackers = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const otherPiece = newBoard[row][col]
      if (otherPiece && (row !== to.row || col !== to.col)) {
        const otherInfo = getPieceInfo(otherPiece)
        if (otherInfo) {
          const moves = getValidMoves(row, col, newBoard, null)
          const canReach = moves.some(move => move.row === to.row && move.col === to.col)

          if (canReach) {
            if (otherInfo.color === color) {
              isDefended = true
            } else {
              attackers++
            }
          }
        }
      }
    }
  }

  // Penalty for moving to attacked square
  if (attackers > 0) {
    const pieceValue = getPieceValue(piece!)
    if (isDefended) {
      // Defended but attacked - risky
      score -= pieceValue * 20
    } else {
      // Undefended and attacked - very bad
      score -= pieceValue * 50
    }
  }

  // 11. Center control bonus
  const centerSquares = [
    { row: 3, col: 3 }, { row: 3, col: 4 },
    { row: 4, col: 3 }, { row: 4, col: 4 }
  ]
  const extendedCenter = [
    { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
    { row: 3, col: 2 }, { row: 3, col: 5 },
    { row: 4, col: 2 }, { row: 4, col: 5 },
    { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
  ]

  if (centerSquares.some(sq => sq.row === to.row && sq.col === to.col)) {
    score += 15
  } else if (extendedCenter.some(sq => sq.row === to.row && sq.col === to.col)) {
    score += 8
  }

  // 12. Development bonus (early game)
  if (pieceInfo.type === 'knight' || pieceInfo.type === 'bishop') {
    const backRank = color === 'white' ? 7 : 0
    if (from.row === backRank) {
      score += 20
    }
  }

  return score
}

/**
 * Gets the best move for the current player
 */
export function getBestMoves(
  boardState: BoardState,
  color: PieceColor,
  enPassantTarget: Position | null,
  hasMoved: any
): { from: Position; to: Position; rank: 'gold' }[] {
  const allMoves: ScoredMove[] = []

  // Find all possible moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col]
      if (piece) {
        const pieceInfo = getPieceInfo(piece)
        if (pieceInfo && pieceInfo.color === color) {
          const validMoves = getValidMoves(row, col, boardState, enPassantTarget)

          for (const move of validMoves) {
            // Skip moves that would leave king in check
            if (wouldBeInCheck(row, col, move.row, move.col, boardState)) {
              continue
            }

            const score = evaluateMove(
              { row, col },
              move,
              boardState,
              enPassantTarget,
              color,
              hasMoved
            )

            allMoves.push({
              from: { row, col },
              to: move,
              score
            })
          }
        }
      }
    }
  }

  // Sort by score (best first)
  allMoves.sort((a, b) => b.score - a.score)

  const result: { from: Position; to: Position; rank: 'gold' }[] = []

  if (allMoves.length === 0) return result

  // Return only the best move
  result.push({ from: allMoves[0].from, to: allMoves[0].to, rank: 'gold' })

  return result
}
