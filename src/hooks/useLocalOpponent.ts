import { useRef, useCallback, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import type { GameOpponent, OpponentMove, OpponentConfig } from '../types/gameOpponent'
import { getStockfishBestMove } from '../utils/ai/stockfish'
import type { BoardState, PieceSymbol } from '../types/chess'

/**
 * Local opponent - bot AI or local friend
 *
 * Responsibilities:
 * - Bot: Calculate and return next move after artificial delay
 * - Friend: Track whose turn it is (for isThinking indicator)
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
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white')
  const [isThinking, setIsThinking] = useState(false)

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
    setIsThinking(true) // Bot starts thinking

    try {
      // Artificial delay to simulate human thinking time (1-2 seconds)
      const delay = 1000 + Math.random() * 1000
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
            // Only include promotion if this move is actually a promotion
            ...(randomMove.promotion && { promotion: randomMove.promotion }),
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
          const fromSquare = positionToSquare(stockfishMove.from.row, stockfishMove.from.col)
          const toSquare = positionToSquare(stockfishMove.to.row, stockfishMove.to.col)

          // Check if this is a pawn promotion (pawn reaching back rank)
          const piece = tempChess.get(fromSquare as any)
          const isPromotion = piece?.type === 'p' && (stockfishMove.to.row === 0 || stockfishMove.to.row === 7)

          const move: OpponentMove = {
            from: fromSquare,
            to: toSquare,
            // Only include promotion if this is actually a pawn promotion
            ...(isPromotion && { promotion: 'q' }),
          }

          // Notify game of bot's move
          moveCallbacksRef.current.forEach(callback => callback(move))
        }
      }
    } finally {
      isCalculatingRef.current = false
      setIsThinking(false) // Bot finished thinking
    }
  }, [config])

  const sendMove = useCallback(async (move: OpponentMove) => {
    // Player made a move
    // For bot mode: trigger bot to calculate response
    // For friend mode: do nothing (local multiplayer)

    // Store the current FEN if provided (so bot calculates from correct position)
    if (move.fen) {
      currentFenRef.current = move.fen

      // Parse FEN to get current turn and update state
      const fenParts = move.fen.split(' ')
      const turn = fenParts[1] === 'w' ? 'white' : 'black'
      setCurrentPlayer(turn)
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

  const opponent: GameOpponent = useMemo(() => {
    // Universal isThinking: true when it's opponent's turn (black)
    // - Friend: black player is thinking
    // - Bot: black player (bot) is thinking, includes calculation state
    const opponentIsThinking = currentPlayer === 'black' && (config.type === 'friend' || isThinking)

    return {
      sendMove,
      onOpponentMove,
      disconnect,
      isOnline: false,
      type: config.type,
      isThinking: opponentIsThinking,
    }
  }, [sendMove, onOpponentMove, disconnect, config.type, currentPlayer, isThinking])

  return opponent
}
