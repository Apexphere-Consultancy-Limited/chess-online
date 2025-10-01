import { useState, useCallback } from 'react'
import {
  GameMode,
  BoardState,
  PieceColor,
  PieceType,
  Move,
  CapturedPieces,
  Score,
  Position,
  INITIAL_BOARD,
  PromotionData,
  PIECES,
  HasMoved,
} from '../types/chess'
import { isValidMove, getPieceInfo, getPieceValue, getValidMoves, isValidCastling, wouldBeInCheck, isCheckmate, isStalemate, isInCheck } from '../utils/chessLogic'

export function useChessGame() {
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
  const [showModal, setShowModal] = useState(true)
  const [hintsRemaining, setHintsRemaining] = useState(3)
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [draggedPiece, setDraggedPiece] = useState<Position | null>(null)
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null)
  const [hasMoved, setHasMoved] = useState<HasMoved>({
    white: { king: false, rookLeft: false, rookRight: false },
    black: { king: false, rookLeft: false, rookRight: false },
  })
  const [enPassantTarget, setEnPassantTarget] = useState<Position | null>(null)
  const [gameOver, setGameOver] = useState<{ winner: PieceColor | 'draw'; reason: string } | null>(null)

  const makeMove = useCallback(
    (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
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

      // Make the move
      const newBoard = boardState.map((row) => [...row])
      let capturedPiece = newBoard[toRow][toCol]

      newBoard[toRow][toCol] = piece
      newBoard[fromRow][fromCol] = null

      // Handle castling - move the rook too
      if (isCastling) {
        const isKingSide = toCol > fromCol
        const rookFromCol = isKingSide ? 7 : 0
        const rookToCol = isKingSide ? toCol - 1 : toCol + 1
        const rook = newBoard[fromRow][rookFromCol]
        newBoard[fromRow][rookToCol] = rook
        newBoard[fromRow][rookFromCol] = null
      }

      // Handle en passant capture
      if (
        pieceInfo.type === 'pawn' &&
        enPassantTarget &&
        toRow === enPassantTarget.row &&
        toCol === enPassantTarget.col &&
        !capturedPiece
      ) {
        // Capture the pawn that's one row behind the target square
        const capturedPawnRow = pieceInfo.color === 'white' ? toRow + 1 : toRow - 1
        capturedPiece = newBoard[capturedPawnRow][toCol]
        newBoard[capturedPawnRow][toCol] = null
      }

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

      // Check for pawn promotion
      if (pieceInfo.type === 'pawn' && (toRow === 0 || toRow === 7)) {
        // Pawn reached the opposite end - trigger promotion
        setBoardState(newBoard)
        setPromotionData({ row: toRow, col: toCol, color: pieceInfo.color })
        return true
      }

      // Create move notation
      const colNames = 'abcdefgh'
      const notation = `${colNames[fromCol]}${8 - fromRow}-${colNames[toCol]}${8 - toRow}`

      // Add to move history
      const move: Move = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece,
        captured: capturedPiece || undefined,
        notation,
        timestamp: Date.now(),
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

      const nextPlayer: PieceColor = currentPlayer === 'white' ? 'black' : 'white'
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
    [boardState, currentPlayer, hasMoved, enPassantTarget]
  )

  const handlePromotion = useCallback(
    (pieceType: PieceType) => {
      if (!promotionData) return

      const newBoard = boardState.map((row) => [...row])
      newBoard[promotionData.row][promotionData.col] = PIECES[promotionData.color][pieceType]

      setBoardState(newBoard)
      setPromotionData(null)
      setCurrentPlayer((prev) => (prev === 'white' ? 'black' : 'white'))
    },
    [promotionData, boardState]
  )

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (!selectedSquare) {
        // Select piece
        const piece = boardState[row][col]
        if (piece) {
          const pieceInfo = getPieceInfo(piece)
          if (pieceInfo && pieceInfo.color === currentPlayer) {
            setSelectedSquare({ row, col })
            setValidMoves(getValidMoves(row, col, boardState, enPassantTarget))
          }
        }
      } else {
        // Try to move piece
        makeMove(selectedSquare.row, selectedSquare.col, row, col)
        setSelectedSquare(null)
        setValidMoves([])
      }
    },
    [selectedSquare, boardState, currentPlayer, makeMove, enPassantTarget]
  )

  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0) return

    // TODO: Implement undo logic
    const lastMove = moveHistory[moveHistory.length - 1]
    console.log('Undo move:', lastMove)
  }, [moveHistory])

  const handleHint = useCallback(() => {
    if (hintsRemaining === 0) return

    // TODO: Implement hint logic with Stockfish
    setHintsRemaining((prev) => prev - 1)
    console.log('Hint requested')
  }, [hintsRemaining])

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
    [boardState, currentPlayer, enPassantTarget]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault() // Allow drop
    e.dataTransfer.dropEffect = 'move' // Show move cursor instead of plus
  }, [])

  const handleDrop = useCallback(
    (row: number, col: number) => {
      if (draggedPiece) {
        makeMove(draggedPiece.row, draggedPiece.col, row, col)
        setDraggedPiece(null)
        setValidMoves([])
      }
    },
    [draggedPiece, makeMove]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null)
    setValidMoves([])
  }, [])

  const handleReset = useCallback(() => {
    setBoardState(JSON.parse(JSON.stringify(INITIAL_BOARD)))
    setCurrentPlayer('white')
    setCapturedPieces({ white: [], black: [] })
    setScore({ white: 0, black: 0 })
    setMoveHistory([])
    setHintsRemaining(3)
    setSelectedSquare(null)
    setDraggedPiece(null)
    setValidMoves([])
    setPromotionData(null)
    setHasMoved({
      white: { king: false, rookLeft: false, rookRight: false },
      black: { king: false, rookLeft: false, rookRight: false },
    })
    setEnPassantTarget(null)
    setGameOver(null)
    setShowModal(true)
  }, [])

  // Check if current player is in check
  const inCheck = isInCheck(currentPlayer, boardState)

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
