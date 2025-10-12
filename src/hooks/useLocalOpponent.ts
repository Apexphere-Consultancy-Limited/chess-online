import { useState, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { GameOpponent, OpponentMove, OpponentConfig } from '../types/gameOpponent'
import { getEasyAIMove } from '../utils/ai/easyAI'
import { getStockfishBestMove } from '../utils/ai/stockfish'
import { BoardState } from '../types/chess'

/**
 * Local opponent - bot AI or local friend
 *
 * Responsibilities:
 * - Bot: Calculate and return next move after artificial delay
 * - Friend: Do nothing (both players are local)
 * - That's it! Game handles all validation, board state, sounds
 */
export function useLocalOpponent(
  config: Exclude<OpponentConfig, { type: 'online' }>,
  boardState: BoardState,
  chessInstance: Chess
): GameOpponent {
  const [moveCallbacks, setMoveCallbacks] = useState<Array<(move: OpponentMove) => void>>([])
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCalculatingRef = useRef(false)

  // Helper to convert board position to algebraic notation
  const positionToSquare = (row: number, col: number): string => {
    const files = 'abcdefgh'
    const ranks = '87654321' // Row 0 = rank 8, row 7 = rank 1
    return `${files[col]}${ranks[row]}`
  }

  // Calculate bot move (only for bot mode)
  const calculateBotMove = useCallback(async () => {
    if (config.type !== 'bot' || isCalculatingRef.current) {
      return
    }

    isCalculatingRef.current = true

    try {
      // Artificial delay for natural feel (200-500ms)
      const delay = 200 + Math.random() * 300
      await new Promise(resolve => setTimeout(resolve, delay))

      let botMove: { from: { row: number; col: number }; to: { row: number; col: number } } | null = null

      if (config.difficulty === 'easy') {
        // Simple random AI
        botMove = getEasyAIMove(boardState, null)
      } else {
        // Stockfish for medium/hard
        const depth = config.difficulty === 'medium' ? 2 : 8
        const stockfishMove = await getStockfishBestMove({
          boardState,
          enPassantTarget: null,
          hasMoved: {
            white: { king: false, rookLeft: false, rookRight: false },
            black: { king: false, rookLeft: false, rookRight: false },
          },
          moveHistory: [],
          inCheck: chessInstance.inCheck(),
          depth,
        })

        if (stockfishMove) {
          botMove = stockfishMove
        }
      }

      if (botMove) {
        const move: OpponentMove = {
          from: positionToSquare(botMove.from.row, botMove.from.col),
          to: positionToSquare(botMove.to.row, botMove.to.col),
          promotion: 'q', // Bot always promotes to queen
        }

        // Notify game of bot's move
        moveCallbacks.forEach(callback => callback(move))
      }
    } finally {
      isCalculatingRef.current = false
    }
  }, [config, boardState, chessInstance, moveCallbacks])

  const opponent: GameOpponent = {
    sendMove: async (move: OpponentMove) => {
      // Player made a move
      // For bot mode: trigger bot to calculate response
      // For friend mode: do nothing (local multiplayer)

      if (config.type === 'bot') {
        // Schedule bot response after short delay
        moveTimeoutRef.current = setTimeout(() => {
          calculateBotMove()
        }, 100)
      }
    },

    onOpponentMove: (callback: (move: OpponentMove) => void) => {
      setMoveCallbacks(prev => [...prev, callback])

      // Return unsubscribe function
      return () => {
        setMoveCallbacks(prev => prev.filter(cb => cb !== callback))
      }
    },

    disconnect: () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
        moveTimeoutRef.current = null
      }
      setMoveCallbacks([])
      isCalculatingRef.current = false
    },

    isOnline: false,
    type: config.type,
  }

  return opponent
}
