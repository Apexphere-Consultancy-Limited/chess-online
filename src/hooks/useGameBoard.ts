import { useState } from 'react'
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
} from '../types/chess'

export function useGameBoard() {
  const [boardState, setBoardState] = useState<BoardState>(
    JSON.parse(JSON.stringify(INITIAL_BOARD))
  )
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white')
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({
    white: [],
    black: [],
  })
  const [score, setScore] = useState<Score>({ white: 0, black: 0 })
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [gameMode, setGameMode] = useState<GameMode>('friend')
  const [hintsRemaining, setHintsRemaining] = useState(3)
  const [hasMoved, setHasMoved] = useState<HasMoved>({
    white: { king: false, rookLeft: false, rookRight: false },
    black: { king: false, rookLeft: false, rookRight: false },
  })
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null)
  const [gameOver, setGameOver] = useState<{ winner: PieceColor | 'draw'; reason: string } | null>(null)
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null)

  // UI State
  const [showModal, setShowModal] = useState(true)
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [draggedPiece, setDraggedPiece] = useState<Position | null>(null)
  const [isComputerThinking, setIsComputerThinking] = useState(false)

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
    resetGame,
  }
}
