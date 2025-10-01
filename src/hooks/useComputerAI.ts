import { useEffect } from 'react'
import { GameMode, PieceColor, BoardState, Position, PromotionData } from '../types/chess'
import { getEasyAIMove } from '../utils/ai/easyAI'

interface UseComputerAIProps {
  gameMode: GameMode
  currentPlayer: PieceColor
  boardState: BoardState
  enPassantTarget: Position | null
  gameOver: { winner: PieceColor | 'draw'; reason: string } | null
  promotionData: PromotionData | null
  isComputerThinking: boolean
  setIsComputerThinking: (value: boolean) => void
  makeMove: (fromRow: number, fromCol: number, toRow: number, toCol: number) => boolean
}

export function useComputerAI({
  gameMode,
  currentPlayer,
  boardState,
  enPassantTarget,
  gameOver,
  promotionData,
  isComputerThinking,
  setIsComputerThinking,
  makeMove,
}: UseComputerAIProps) {
  useEffect(() => {
    // Only make computer move if:
    // 1. Game mode is ai-easy
    // 2. It's black's turn (computer plays black)
    // 3. Game is not over
    // 4. Computer is not already thinking
    // 5. No promotion modal is showing
    if (
      gameMode === 'ai-easy' &&
      currentPlayer === 'black' &&
      !gameOver &&
      !isComputerThinking &&
      !promotionData
    ) {
      setIsComputerThinking(true)

      // Wait 1 second before making move (so user can see "thinking")
      setTimeout(() => {
        const move = getEasyAIMove(boardState, enPassantTarget)

        if (move) {
          makeMove(move.from.row, move.from.col, move.to.row, move.to.col)
        }

        setIsComputerThinking(false)
      }, 1000)
    }
  }, [gameMode, currentPlayer, gameOver, isComputerThinking, promotionData, boardState, enPassantTarget, makeMove, setIsComputerThinking])
}
