import { useEffect, useRef } from 'react'
import {
  GameMode,
  PieceColor,
  BoardState,
  Position,
  PromotionData,
  HasMoved,
  Move,
  PieceType,
} from '../types/chess'
import { getEasyAIMove } from '../utils/ai/easyAI'
import { getStockfishBestMove, stopStockfishSearch, StockfishBestMove } from '../utils/ai/stockfish'

const STOCKFISH_TIMEOUT_MS = 5000

interface UseComputerAIProps {
  gameMode: GameMode
  currentPlayer: PieceColor
  boardState: BoardState
  enPassantTarget: Position | null
  gameOver: { winner: PieceColor | 'draw'; reason: string } | null
  promotionData: PromotionData | null
  setIsComputerThinking: (value: boolean) => void
  isComputerThinking: boolean
  hasMoved: HasMoved
  moveHistory: Move[]
  inCheck: boolean
  makeMove: (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    promotionChoice?: PieceType
  ) => boolean
}

export function useComputerAI({
  gameMode,
  currentPlayer,
  boardState,
  enPassantTarget,
  gameOver,
  promotionData,
  setIsComputerThinking,
  isComputerThinking,
  hasMoved,
  moveHistory,
  inCheck,
  makeMove,
}: UseComputerAIProps) {
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const isComputerMode = gameMode === 'ai-easy' || gameMode === 'ai-medium' || gameMode === 'ai-hard'
    const isComputerTurn = isComputerMode && currentPlayer === 'black'

    if (!isComputerTurn || gameOver || promotionData) {
      return
    }

    let cancelled = false
    let delayTimer: number | null = null
    let searchTimer: number | null = null

    const triggerComputerMove = async () => {
      setIsComputerThinking(true)

      try {
        // Determine delay based on whether bot is in check
        const thinkingDelay = inCheck ? 6000 : 2000 // 6 seconds if in check, 2 seconds normally

        await new Promise<void>((resolve) => {
          delayTimer = window.setTimeout(() => resolve(), thinkingDelay)
        })

        if (cancelled) {
          return
        }

        let plannedMove: StockfishBestMove | null = null

        if (gameMode === 'ai-easy') {
          const move = getEasyAIMove(boardState, enPassantTarget)
          if (move) {
            plannedMove = {
              from: move.from,
              to: move.to,
            }
          }
        } else {
          const depth = gameMode === 'ai-medium' ? 2 : 8
          const stockfishPromise = getStockfishBestMove({
            boardState,
            currentPlayer,
            hasMoved,
            enPassantTarget,
            moveHistory,
            search: { depth },
          })
          const timeoutPromise = new Promise<StockfishBestMove | null>((resolve) => {
            searchTimer = window.setTimeout(() => resolve(null), STOCKFISH_TIMEOUT_MS)
          })

          plannedMove = await Promise.race([stockfishPromise, timeoutPromise])

          if (searchTimer) {
            window.clearTimeout(searchTimer)
            searchTimer = null
          }

          if (cancelled) {
            return
          }

          if (!plannedMove) {
            stopStockfishSearch()
            const fallback = getEasyAIMove(boardState, enPassantTarget)
            if (fallback) {
              plannedMove = {
                from: fallback.from,
                to: fallback.to,
              }
            }
          }
        }

        if (!cancelled && plannedMove) {
          const moveApplied = makeMove(
            plannedMove.from.row,
            plannedMove.from.col,
            plannedMove.to.row,
            plannedMove.to.col,
            plannedMove.promotion
          )

          if (!moveApplied && gameMode !== 'ai-easy') {
            const fallback = getEasyAIMove(boardState, enPassantTarget)
            if (!cancelled && fallback) {
              makeMove(fallback.from.row, fallback.from.col, fallback.to.row, fallback.to.col)
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('Computer move failed', error)
        }
        stopStockfishSearch()
      } finally {
        if (isMountedRef.current) {
          setIsComputerThinking(false)
        }
      }
    }

    triggerComputerMove()

    return () => {
      cancelled = true
      if (delayTimer) {
        window.clearTimeout(delayTimer)
      }
      if (searchTimer) {
        window.clearTimeout(searchTimer)
      }
      if (gameMode !== 'ai-easy') {
        stopStockfishSearch()
      }
      if (isMountedRef.current) {
        setIsComputerThinking(false)
      }
    }
  }, [
    gameMode,
    currentPlayer,
    boardState,
    enPassantTarget,
    gameOver,
    promotionData,
    hasMoved,
    moveHistory,
    inCheck,
    makeMove,
    setIsComputerThinking,
  ])
}
