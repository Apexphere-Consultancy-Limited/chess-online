import { useState, useEffect } from 'react'
import {
  BoardState,
  PieceColor,
  CapturedPieces,
  Score,
  Move,
  GameMode,
  HasMoved,
  Position,
  INITIAL_BOARD,
  PromotionData,
  GameState,
} from '../types/chess'

const STORAGE_KEY = 'chess-game-state'
const OLD_STORAGE_KEY = 'chessGameState'

function loadGameState(): GameState | null {
  try {
    // Clean up old storage key from vanilla JS version
    if (localStorage.getItem(OLD_STORAGE_KEY)) {
      localStorage.removeItem(OLD_STORAGE_KEY)
    }

    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function saveGameState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save game state:', error)
  }
}

export function useGameBoard() {
  const savedState = loadGameState()

  const [boardState, setBoardState] = useState<BoardState>(
    savedState?.boardState ?? JSON.parse(JSON.stringify(INITIAL_BOARD))
  )
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>(
    savedState?.currentPlayer ?? 'white'
  )
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>(
    savedState?.capturedPieces ?? { white: [], black: [] }
  )
  const [score, setScore] = useState<Score>(savedState?.score ?? { white: 0, black: 0 })
  const [moveHistory, setMoveHistory] = useState<Move[]>(savedState?.moveHistory ?? [])
  const [gameMode, setGameMode] = useState<GameMode>(savedState?.gameMode ?? 'friend')
  const [hintsRemaining, setHintsRemaining] = useState(savedState?.hintsRemaining ?? 3)
  const [hasMoved, setHasMoved] = useState<HasMoved>(
    savedState?.hasMoved ?? {
      white: { king: false, rookLeft: false, rookRight: false },
      black: { king: false, rookLeft: false, rookRight: false },
    }
  )
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(
    savedState?.enPassantTarget ?? null
  )
  const [gameOver, setGameOver] = useState<{ winner: PieceColor | 'draw'; reason: string } | null>(
    savedState?.gameOver ? savedState.gameOver : null
  )
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null)

  // UI State
  const [showModal, setShowModal] = useState(!savedState)
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [draggedPiece, setDraggedPiece] = useState<Position | null>(null)
  const [isComputerThinking, setIsComputerThinking] = useState(false)
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null)
  const [hintSquares, setHintSquares] = useState<{ from: Position; to: Position; rank: 'gold' }[]>([])

  // Timer State (in seconds)
  const [whiteTimeLeft, setWhiteTimeLeft] = useState(savedState?.whiteTimeLeft ?? 600) // 10 minutes = 600 seconds
  const [blackTimeLeft, setBlackTimeLeft] = useState(savedState?.blackTimeLeft ?? 600)
  const [timerActive, setTimerActive] = useState(savedState?.timerActive ?? false)

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || gameOver) return

    const interval = setInterval(() => {
      if (currentPlayer === 'white') {
        setWhiteTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setTimerActive(false)
            return 0
          }
          return prev - 1
        })
      } else {
        setBlackTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setTimerActive(false)
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timerActive, currentPlayer, gameOver])

  // Check for time out
  useEffect(() => {
    if (whiteTimeLeft === 0 && !gameOver) {
      setGameOver({ winner: 'black', reason: 'timeout' })
      setTimerActive(false)
    } else if (blackTimeLeft === 0 && !gameOver) {
      setGameOver({ winner: 'white', reason: 'timeout' })
      setTimerActive(false)
    }
  }, [whiteTimeLeft, blackTimeLeft, gameOver, setGameOver])

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    const gameState: GameState = {
      boardState,
      currentPlayer,
      capturedPieces,
      score,
      moveHistory,
      gameMode,
      hintsRemaining,
      hasMoved,
      enPassantTarget,
      gameOver: gameOver ?? false,
      whiteTimeLeft,
      blackTimeLeft,
      timerActive,
    }
    saveGameState(gameState)
  }, [
    boardState,
    currentPlayer,
    capturedPieces,
    score,
    moveHistory,
    gameMode,
    hintsRemaining,
    hasMoved,
    enPassantTarget,
    gameOver,
    whiteTimeLeft,
    blackTimeLeft,
    timerActive,
  ])

  const resetGame = () => {
    setBoardState(JSON.parse(JSON.stringify(INITIAL_BOARD)))
    setCurrentPlayer('white')
    setCapturedPieces({ white: [], black: [] })
    setScore({ white: 0, black: 0 })
    setMoveHistory([])
    setHintsRemaining(3)
    setHasMoved({
      white: { king: false, rookLeft: false, rookRight: false },
      black: { king: false, rookLeft: false, rookRight: false },
    })
    setEnPassantTarget(null)
    setGameOver(null)
    setPromotionData(null)
    setSelectedSquare(null)
    setValidMoves([])
    setDraggedPiece(null)
    setIsComputerThinking(false)
    setLastMove(null)
    setWhiteTimeLeft(600)
    setBlackTimeLeft(600)
    setTimerActive(false)
    setHintSquares([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    boardState,
    setBoardState,
    currentPlayer,
    setCurrentPlayer,
    capturedPieces,
    setCapturedPieces,
    score,
    setScore,
    moveHistory,
    setMoveHistory,
    gameMode,
    setGameMode,
    hintsRemaining,
    setHintsRemaining,
    hasMoved,
    setHasMoved,
    enPassantTarget,
    setEnPassantTarget,
    gameOver,
    setGameOver,
    promotionData,
    setPromotionData,
    showModal,
    setShowModal,
    selectedSquare,
    setSelectedSquare,
    validMoves,
    setValidMoves,
    draggedPiece,
    setDraggedPiece,
    isComputerThinking,
    setIsComputerThinking,
    lastMove,
    setLastMove,
    whiteTimeLeft,
    setWhiteTimeLeft,
    blackTimeLeft,
    setBlackTimeLeft,
    timerActive,
    setTimerActive,
    hintSquares,
    setHintSquares,
    resetGame,
  }
}
