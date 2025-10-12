import { useState, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { GameOpponent, ChessMove, GameResult, OpponentConfig } from '../types/gameOpponent'
import { getEasyAIMove } from '../utils/ai/easyAI'
import { getStockfishBestMove } from '../utils/ai/stockfish'
import { BoardState } from '../types/chess'

/**
 * Local opponent implementation for bot AI and local friend
 * Bot AI runs calculations in browser with artificial delay
 * Friend mode just echoes moves back (no opponent logic)
 */
export function useLocalOpponent(
  config: OpponentConfig,
  chessInstance: Chess,
  boardState: BoardState
): GameOpponent {
  const [moveCallbacks, setMoveCallbacks] = useState<Array<(move: ChessMove) => void>>([])
  const [gameEndCallbacks, setGameEndCallbacks] = useState<Array<(result: GameResult) => void>>([])
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCalculatingRef = useRef(false)

  // Helper to convert board position to algebraic notation
  const positionToSquare = (row: number, col: number): string => {
    const files = 'abcdefgh'
    const ranks = '87654321' // Row 0 = rank 8, row 7 = rank 1
    return `${files[col]}${ranks[row]}`
  }

  // Calculate bot move with artificial delay
  const calculateBotMove = useCallback(async () => {
    if (config.type !== 'bot' || isCalculatingRef.current) {
      return
    }

    isCalculatingRef.current = true

    try {
      // Artificial delay to make bot feel more natural (200-500ms)
      const delay = 200 + Math.random() * 300
      await new Promise(resolve => setTimeout(resolve, delay))

      let botMove: { from: { row: number; col: number }; to: { row: number; col: number } } | null = null

      if (config.difficulty === 'easy') {
        // Use simple random AI
        const enPassantTarget = null // TODO: pass from game state if needed
        botMove = getEasyAIMove(boardState, enPassantTarget)
      } else {
        // Use Stockfish for medium/hard
        const depth = config.difficulty === 'medium' ? 2 : 8
        const stockfishMove = await getStockfishBestMove({
          boardState,
          enPassantTarget: null, // TODO: pass from game state if needed
          hasMoved: {
            white: { king: false, rookLeft: false, rookRight: false },
            black: { king: false, rookLeft: false, rookRight: false },
          }, // TODO: pass from game state
          moveHistory: [], // TODO: pass from game state
          inCheck: chessInstance.inCheck(),
          depth,
        })

        if (stockfishMove) {
          botMove = stockfishMove
        }
      }

      if (botMove) {
        const from = positionToSquare(botMove.from.row, botMove.from.col)
        const to = positionToSquare(botMove.to.row, botMove.to.col)

        // Apply move to chess instance to get FEN
        const move = chessInstance.move({ from, to, promotion: 'q' })

        if (move) {
          const chessMove: ChessMove = {
            from,
            to,
            fen: chessInstance.fen(),
            promotion: move.promotion,
          }

          // Notify all subscribers
          moveCallbacks.forEach(callback => callback(chessMove))

          // Check for game end
          if (chessInstance.isGameOver()) {
            let result: GameResult
            if (chessInstance.isCheckmate()) {
              result = {
                winner: chessInstance.turn() === 'w' ? 'black' : 'white',
                reason: 'checkmate',
              }
            } else if (chessInstance.isStalemate()) {
              result = { winner: 'draw', reason: 'stalemate' }
            } else if (chessInstance.isInsufficientMaterial()) {
              result = { winner: 'draw', reason: 'insufficient_material' }
            } else {
              result = { winner: 'draw', reason: 'draw_agreement' }
            }
            gameEndCallbacks.forEach(callback => callback(result))
          }
        }
      }
    } finally {
      isCalculatingRef.current = false
    }
  }, [config, boardState, chessInstance, moveCallbacks, gameEndCallbacks])

  const opponent: GameOpponent = {
    sendMove: async (move: ChessMove) => {
      // For local games, the move is already applied by the UI
      // For bot mode, trigger bot response
      if (config.type === 'bot') {
        // Schedule bot move after a short delay
        moveTimeoutRef.current = setTimeout(() => {
          calculateBotMove()
        }, 100)
      }

      // For friend mode, do nothing (local multiplayer)
    },

    onOpponentMove: (callback: (move: ChessMove) => void) => {
      setMoveCallbacks(prev => [...prev, callback])

      // Return unsubscribe function
      return () => {
        setMoveCallbacks(prev => prev.filter(cb => cb !== callback))
      }
    },

    onGameEnd: (callback: (result: GameResult) => void) => {
      setGameEndCallbacks(prev => [...prev, callback])

      // Return unsubscribe function
      return () => {
        setGameEndCallbacks(prev => prev.filter(cb => cb !== callback))
      }
    },

    disconnect: () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
        moveTimeoutRef.current = null
      }
      setMoveCallbacks([])
      setGameEndCallbacks([])
      isCalculatingRef.current = false
    },

    isOnline: false,
    type: config.type,
  }

  return opponent
}
