import { useCallback } from 'react'
import { PieceType, PIECES, INITIAL_BOARD } from '../types/chess'
import {
  isValidMove,
  getPieceInfo,
  getPieceValue,
  getValidMoves,
  isValidCastling,
  wouldBeInCheck,
  isCheckmate,
  isStalemate,
  isInCheck,
  executeMove,
  getBestMoves,
} from '../utils/chess'
import { useGameBoard } from './useGameBoard'
import { useComputerAI } from './useComputerAI'

export function useMoveRules() {
  // Use modular hooks
  const gameState = useGameBoard()

  const {
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
  } = gameState

  const makeMove = useCallback(
    (fromRow: number, fromCol: number, toRow: number, toCol: number, promotionChoice?: PieceType) => {
      const piece = boardState[fromRow][fromCol]
      if (!piece) return false

      const pieceInfo = getPieceInfo(piece)
      if (!pieceInfo || pieceInfo.color !== currentPlayer) return false

      // Check for castling
      const isCastling =
        pieceInfo.type === 'king' &&
        Math.abs(toCol - fromCol) === 2 &&
        isValidCastling(fromRow, fromCol, toRow, toCol, boardState, hasMoved[pieceInfo.color])

      if (!isCastling && !isValidMove(fromRow, fromCol, toRow, toCol, boardState, enPassantTarget)) {
        return false
      }

      // Check if the move would leave the king in check
      if (wouldBeInCheck(fromRow, fromCol, toRow, toCol, boardState)) {
        return false
      }

      // Execute the move (handles castling and en passant)
      const { newBoard, capturedPiece } = executeMove(
        fromRow,
        fromCol,
        toRow,
        toCol,
        boardState,
        enPassantTarget,
        isCastling
      )

      // Handle captures
      if (capturedPiece) {
        const capturedInfo = getPieceInfo(capturedPiece)
        if (capturedInfo) {
          const capturingColor = currentPlayer
          setCapturedPieces((prev) => ({
            ...prev,
            [capturingColor]: [...prev[capturingColor], capturedPiece],
          }))
          setScore((prev) => ({
            ...prev,
            [capturingColor]: prev[capturingColor] + getPieceValue(capturedPiece),
          }))
        }
      }

      let promotionSelected: PieceType | null = null

      if (pieceInfo.type === 'pawn' && (toRow === 0 || toRow === 7)) {
        if (promotionChoice) {
          newBoard[toRow][toCol] = PIECES[pieceInfo.color][promotionChoice]
          promotionSelected = promotionChoice
        } else {
          setBoardState(newBoard)
          setPromotionData({ row: toRow, col: toCol, color: pieceInfo.color })
          return true
        }
      }

      // Create move notation
      const colNames = 'abcdefgh'
      const notation = `${colNames[fromCol]}${8 - fromRow}-${colNames[toCol]}${8 - toRow}`

      // Add to move history
      const move = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece,
        captured: capturedPiece || undefined,
        notation,
        timestamp: Date.now(),
        promotion: promotionSelected ?? undefined,
      }

      // Update hasMoved state
      if (pieceInfo.type === 'king') {
        setHasMoved((prev) => ({
          ...prev,
          [pieceInfo.color]: { ...prev[pieceInfo.color], king: true },
        }))
      } else if (pieceInfo.type === 'rook') {
        if (fromCol === 0) {
          setHasMoved((prev) => ({
            ...prev,
            [pieceInfo.color]: { ...prev[pieceInfo.color], rookLeft: true },
          }))
        } else if (fromCol === 7) {
          setHasMoved((prev) => ({
            ...prev,
            [pieceInfo.color]: { ...prev[pieceInfo.color], rookRight: true },
          }))
        }
      }

      // Update en passant target for pawn double moves
      if (pieceInfo.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
        setEnPassantTarget({ row: (fromRow + toRow) / 2, col: fromCol })
      } else {
        setEnPassantTarget(null)
      }

      setBoardState(newBoard)
      setMoveHistory((prev) => [...prev, move])
      setLastMove({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } })

      // Clear hints when a move is made
      setHintSquares([])

      // Start timer on first move
      if (moveHistory.length === 0) {
        setTimerActive(true)
      }

      const nextPlayer = currentPlayer === 'white' ? 'black' : 'white'
      setCurrentPlayer(nextPlayer)

      // Check for checkmate or stalemate after the move
      setTimeout(() => {
        if (isCheckmate(nextPlayer, newBoard, enPassantTarget)) {
          setGameOver({ winner: currentPlayer, reason: 'checkmate' })
        } else if (isStalemate(nextPlayer, newBoard, enPassantTarget)) {
          setGameOver({ winner: 'draw', reason: 'stalemate' })
        }
      }, 0)

      return true
    },
    [boardState, currentPlayer, hasMoved, enPassantTarget, moveHistory.length, setBoardState, setCapturedPieces, setScore, setPromotionData, setHasMoved, setEnPassantTarget, setMoveHistory, setLastMove, setHintSquares, setTimerActive, setCurrentPlayer, setGameOver]
  )

  // Check if current player is in check
  const inCheck = isInCheck(currentPlayer, boardState)

  // Computer AI
  useComputerAI({
    gameMode,
    currentPlayer,
    boardState,
    enPassantTarget,
    gameOver,
    promotionData,
    hasMoved,
    moveHistory,
    inCheck,
    isComputerThinking,
    setIsComputerThinking,
    makeMove,
  })

  const handlePromotion = useCallback(
    (pieceType: PieceType) => {
      if (!promotionData) return

      const newBoard = boardState.map((row) => [...row])
      newBoard[promotionData.row][promotionData.col] = PIECES[promotionData.color][pieceType]

      setBoardState(newBoard)
      setPromotionData(null)
      setCurrentPlayer((prev) => (prev === 'white' ? 'black' : 'white'))
    },
    [promotionData, boardState, setBoardState, setPromotionData, setCurrentPlayer]
  )

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (!selectedSquare) {
        const piece = boardState[row][col]
        if (piece) {
          const pieceInfo = getPieceInfo(piece)
          if (pieceInfo && pieceInfo.color === currentPlayer) {
            setSelectedSquare({ row, col })
            setValidMoves(getValidMoves(row, col, boardState, enPassantTarget))
          }
        }
      } else {
        makeMove(selectedSquare.row, selectedSquare.col, row, col)
        setSelectedSquare(null)
        setValidMoves([])
      }
    },
    [selectedSquare, boardState, currentPlayer, makeMove, enPassantTarget, setSelectedSquare, setValidMoves]
  )

  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0) return

    const newHistory = moveHistory.slice(0, -1)

    // Reconstruct the board state by replaying all moves except the last one
    let newBoard = JSON.parse(JSON.stringify(INITIAL_BOARD))
    let newCapturedPieces = { white: [], black: [] }
    let newScore = { white: 0, black: 0 }
    let newHasMoved = {
      white: { king: false, rookLeft: false, rookRight: false },
      black: { king: false, rookLeft: false, rookRight: false },
    }
    let newEnPassantTarget: Position | null = null

    // Replay all moves except the last one
    for (let i = 0; i < newHistory.length; i++) {
      const move = newHistory[i]
      const piece = newBoard[move.from.row][move.from.col]
      const pieceInfo = getPieceInfo(piece)

      if (!pieceInfo) continue

      // Check for castling
      const isCastling =
        pieceInfo.type === 'king' &&
        Math.abs(move.to.col - move.from.col) === 2 &&
        isValidCastling(move.from.row, move.from.col, move.to.row, move.to.col, newBoard, newHasMoved[pieceInfo.color])

      // Execute the move
      const result = executeMove(
        move.from.row,
        move.from.col,
        move.to.row,
        move.to.col,
        newBoard,
        newEnPassantTarget,
        isCastling
      )

      newBoard = result.newBoard

      // Handle promotion
      if (move.promotion) {
        newBoard[move.to.row][move.to.col] = PIECES[pieceInfo.color][move.promotion]
      }

      // Handle captures
      if (result.capturedPiece) {
        newCapturedPieces[pieceInfo.color].push(result.capturedPiece)
        newScore[pieceInfo.color] += getPieceValue(result.capturedPiece)
      }

      // Track piece movements for castling
      if (pieceInfo.type === 'king') {
        newHasMoved[pieceInfo.color].king = true
      } else if (pieceInfo.type === 'rook') {
        if (move.from.col === 0) {
          newHasMoved[pieceInfo.color].rookLeft = true
        } else if (move.from.col === 7) {
          newHasMoved[pieceInfo.color].rookRight = true
        }
      }

      // Update en passant target for pawn double moves
      if (pieceInfo.type === 'pawn' && Math.abs(move.to.row - move.from.row) === 2) {
        newEnPassantTarget = { row: (move.from.row + move.to.row) / 2, col: move.from.col }
      } else {
        newEnPassantTarget = null
      }
    }

    // Update all states
    setBoardState(newBoard)
    setMoveHistory(newHistory)
    setCapturedPieces(newCapturedPieces)
    setScore(newScore)
    setHasMoved(newHasMoved)
    setEnPassantTarget(newEnPassantTarget)
    setCurrentPlayer(newHistory.length % 2 === 0 ? 'white' : 'black')
    setLastMove(newHistory.length > 0 ? { from: newHistory[newHistory.length - 1].from, to: newHistory[newHistory.length - 1].to } : null)
    setSelectedSquare(null)
    setValidMoves([])
    setGameOver(null)
  }, [moveHistory, setBoardState, setMoveHistory, setCapturedPieces, setScore, setHasMoved, setEnPassantTarget, setCurrentPlayer, setLastMove, setSelectedSquare, setValidMoves, setGameOver])

  const handleHint = useCallback(() => {
    // Get the best moves (unlimited hints)
    const bestMoves = getBestMoves(boardState, currentPlayer, enPassantTarget, hasMoved)

    // Set the hint squares (will be cleared when player makes a move)
    setHintSquares(bestMoves)
  }, [boardState, currentPlayer, enPassantTarget, hasMoved, setHintSquares])

  const handleDragStart = useCallback(
    (row: number, col: number) => {
      const piece = boardState[row][col]
      if (piece) {
        const pieceInfo = getPieceInfo(piece)
        if (pieceInfo && pieceInfo.color === currentPlayer) {
          setDraggedPiece({ row, col })
          setValidMoves(getValidMoves(row, col, boardState, enPassantTarget))
        }
      }
    },
    [boardState, currentPlayer, enPassantTarget, setDraggedPiece, setValidMoves]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (row: number, col: number) => {
      if (draggedPiece) {
        makeMove(draggedPiece.row, draggedPiece.col, row, col)
        setDraggedPiece(null)
        setValidMoves([])
      }
    },
    [draggedPiece, makeMove, setDraggedPiece, setValidMoves]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null)
    setValidMoves([])
  }, [setDraggedPiece, setValidMoves])

  const handleReset = useCallback(() => {
    resetGame()
    setShowModal(true)
  }, [resetGame, setShowModal])

  return {
    boardState,
    currentPlayer,
    capturedPieces,
    score,
    moveHistory,
    gameMode,
    showModal,
    hintsRemaining,
    selectedSquare,
    validMoves,
    draggedPiece,
    promotionData,
    gameOver,
    inCheck,
    isComputerThinking,
    lastMove,
    whiteTimeLeft,
    blackTimeLeft,
    timerActive,
    hintSquares,
    handleSquareClick,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handlePromotion,
    handleUndo,
    handleHint,
    handleReset,
    setGameMode,
    setShowModal,
  }
}
