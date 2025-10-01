import { BoardState, Position } from '../../types/chess'
import { getAllLegalMoves } from '../chess'

/**
 * AI Easy Mode - Makes random legal moves
 * This provides a beatable opponent for beginners
 */
export function getEasyAIMove(
  boardState: BoardState,
  enPassantTarget: Position | null
): { from: Position; to: Position } | null {
  const legalMoves = getAllLegalMoves('black', boardState, enPassantTarget)

  if (legalMoves.length === 0) {
    return null
  }

  // Pick a random legal move
  const randomIndex = Math.floor(Math.random() * legalMoves.length)
  return legalMoves[randomIndex]
}
