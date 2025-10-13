import { useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import type { GameOpponent, OpponentMove, OpponentConfig } from '../types/gameOpponent'
import { getStockfishBestMove } from '../utils/ai/stockfish'
import type { BoardState, PieceSymbol } from '../types/chess'

/**
 * Local opponent - bot AI or local friend
 *
 * Responsibilities:
 * - Bot: Calculate and return next move after artificial delay
 * - Friend: Do nothing (both players are local)
 * - That's it! Game handles all validation, board state, sounds
 *
 * Note: The bot creates a temporary Chess instance from FEN to calculate moves,
 * ensuring it always works with the current board state
 */
export function useLocalOpponent(
  config: Exclude<OpponentConfig, { type: 'online' }>,
  _boardState: BoardState,
  _chessInstance: Chess
): GameOpponent {
  const moveCallbacksRef = useRef<Array<(move: OpponentMove) => void>>([])
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCalculatingRef = useRef(false)
  const currentFenRef = useRef<string>('')

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

      // Create a fresh Chess instance from the current FEN to calculate moves
      const tempChess = new Chess(currentFenRef.current || undefined)

      if (config.difficulty === 'easy') {
        // Use chess.js to get all legal moves and pick one randomly
        const moves = tempChess.moves({ verbose: true })
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)]

          const move: OpponentMove = {
            from: randomMove.from,
            to: randomMove.to,
            promotion: randomMove.promotion || 'q',
          }

          // Notify game of bot's move
          moveCallbacksRef.current.forEach(callback => callback(move))
        }
      } else {
        // Stockfish for medium/hard
        // Get current board state from temp chess instance
        const currentBoard = tempChess.board()
        const currentBoardState: BoardState = []

        for (let row = 0; row < 8; row++) {
          const boardRow: (PieceSymbol | null)[] = []
          for (let col = 0; col < 8; col++) {
            const piece = currentBoard[row][col]
            if (piece) {
              // Convert chess.js piece to symbol
              const pieceMap: Record<string, Record<string, PieceSymbol>> = {
                w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
                b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
              }
              boardRow.push(pieceMap[piece.color]?.[piece.type] || null)
            } else {
              boardRow.push(null)
            }
          }
          currentBoardState.push(boardRow)
        }

        const depth = config.difficulty === 'medium' ? 2 : 8
        const stockfishMove = await getStockfishBestMove({
          boardState: currentBoardState,
          currentPlayer: tempChess.turn() === 'w' ? 'white' : 'black',
          enPassantTarget: null,
          hasMoved: {
            white: { king: false, rookLeft: false, rookRight: false },
            black: { king: false, rookLeft: false, rookRight: false },
          },
          moveHistory: [],
          search: { depth },
        })

        if (stockfishMove) {
          const move: OpponentMove = {
            from: positionToSquare(stockfishMove.from.row, stockfishMove.from.col),
            to: positionToSquare(stockfishMove.to.row, stockfishMove.to.col),
            promotion: 'q', // Bot always promotes to queen
          }

          // Notify game of bot's move
          moveCallbacksRef.current.forEach(callback => callback(move))
        }
      }
    } finally {
      isCalculatingRef.current = false
    }
  }, [config])

  const sendMove = useCallback(async (move: OpponentMove) => {
    // Player made a move
    // For bot mode: trigger bot to calculate response
    // For friend mode: do nothing (local multiplayer)

    // Store the current FEN if provided (so bot calculates from correct position)
    if (move.fen) {
      currentFenRef.current = move.fen
    }

    if (config.type === 'bot') {
      // Schedule bot response after short delay
      moveTimeoutRef.current = setTimeout(() => {
        calculateBotMove()
      }, 100)
    }
  }, [config.type, calculateBotMove])

  const onOpponentMove = useCallback((callback: (move: OpponentMove) => void) => {
    moveCallbacksRef.current.push(callback)

    // Return unsubscribe function
    return () => {
      moveCallbacksRef.current = moveCallbacksRef.current.filter(cb => cb !== callback)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current)
      moveTimeoutRef.current = null
    }
    moveCallbacksRef.current = []
    isCalculatingRef.current = false
  }, [])

  const opponent: GameOpponent = useMemo(() => ({
    sendMove,
    onOpponentMove,
    disconnect,
    isOnline: false,
    type: config.type,
  }), [sendMove, onOpponentMove, disconnect, config.type])

  return opponent
}
