import { useEffect, useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { GameOpponent } from '../types/gameOpponent'
import { useChessSounds } from '../hooks/useChessSounds'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { resignGame } from '../hooks/useMakeMove'
import ChessBoard from './ChessBoard'
import MoveHistory from './MoveHistory'
import CapturedPieces from './CapturedPieces'
import Timer from './Timer'
import PromotionModal from './PromotionModal'
import GameOverModal from './GameOverModal'
import GameControls from './GameControls'
import BotChat from './BotChat'
import ConfirmationModal from './ConfirmationModal'
import { PIECES, PIECE_VALUES } from '../types/chess'
import type { BoardState, PieceSymbol, PieceType, Move, PieceColor } from '../types/chess'

/**
 * ChessGame Component
 *
 * The single chess game component that works for ALL game modes:
 * - Online multiplayer (vs human over network)
 * - Local vs Bot (easy/medium/hard AI)
 * - Local vs Friend (local multiplayer)
 *
 * Architecture:
 * - Game Component: Owns ALL game logic (rules, board, sounds, UI)
 * - Opponent: ONLY handles communication (sendMove/onOpponentMove)
 */

interface ChessGameProps {
  opponent: GameOpponent
  playerColor?: 'white' | 'black' // For online games, which color am I?
  gameMode?: 'friend' | 'ai-easy' | 'ai-medium' | 'ai-hard' // For offline games
  gameId?: string // For online games, needed for timer sync
  initialFen?: string // For online games, start from saved position
  onForfeit?: () => void // Callback when player forfeits (for navigation)
  externalGameResult?: { // For online games, when opponent resigns/times out
    winner: 'white' | 'black' | 'draw'
    reason: string
  }
}

const TYPE_MAP: Record<string, PieceType> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

export default function ChessGame({
  opponent,
  playerColor = 'white',
  gameMode = 'friend',
  gameId,
  initialFen,
  onForfeit,
  externalGameResult
}: ChessGameProps) {
  // Chess.js instance (owns game rules)
  const [chess] = useState(() => new Chess())
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Auth (for checking if move is ours in online games)
  const { user } = useAuth()

  // Sound effects
  const { playMoveSound, playCaptureSound, playCheckSound, playCheckmateSound } = useChessSounds()

  // Board state
  const [boardState, setBoardState] = useState<BoardState>(() =>
    Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null))
  )

  // Game state
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white')
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null)
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([])
  const [draggedPiece, setDraggedPiece] = useState<{ row: number; col: number } | null>(null)
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null)
  const [hintSquares, setHintSquares] = useState<{ from: { row: number; col: number }; to: { row: number; col: number }; rank: 'gold' }[]>([])

  // Move history and captures
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [capturedPieces, setCapturedPieces] = useState<{
    white: PieceSymbol[]
    black: PieceSymbol[]
  }>({ white: [], black: [] })
  const [score, setScore] = useState<{ white: number; black: number }>({ white: 0, black: 0 })

  // Modals and game state
  const [promotionData, setPromotionData] = useState<{ row: number; col: number; color: PieceColor } | null>(null)
  const [gameOver, setGameOver] = useState<{ winner: PieceColor | 'draw'; reason: string } | null>(null)
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Timers
  const [whiteTimeLeft, setWhiteTimeLeft] = useState(600) // 10 minutes
  const [blackTimeLeft, setBlackTimeLeft] = useState(600)
  const [timerActive, setTimerActive] = useState(false)

  // Timer countdown for online games
  useEffect(() => {
    if (!opponent.isOnline || !timerActive || gameOver) return

    const interval = setInterval(() => {
      if (currentPlayer === 'white') {
        setWhiteTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false)
            // Handle timeout - white loses
            if (gameId) {
              ;(async () => {
                try {
                  await supabase
                    .from('games')
                    .update({
                      status: 'completed',
                      result: 'black wins on time',
                      winner: 'black',
                    })
                    .eq('id', gameId)
                  setGameOver({ winner: 'black', reason: 'timeout' })
                } catch (err) {
                  console.error('Failed to update game on timeout:', err)
                }
              })()
            }
            return 0
          }
          return prev - 1
        })
      } else {
        setBlackTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false)
            // Handle timeout - black loses
            if (gameId) {
              ;(async () => {
                try {
                  await supabase
                    .from('games')
                    .update({
                      status: 'completed',
                      result: 'white wins on time',
                      winner: 'white',
                    })
                    .eq('id', gameId)
                  setGameOver({ winner: 'white', reason: 'timeout' })
                } catch (err) {
                  console.error('Failed to update game on timeout:', err)
                }
              })()
            }
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [opponent.isOnline, timerActive, currentPlayer, gameOver, gameId])

  // Update captured pieces
  const updateCapturedPieces = useCallback((board: any) => {
    const whiteCaptured: PieceSymbol[] = []
    const blackCaptured: PieceSymbol[] = []

    // Count pieces on board
    const piecesOnBoard = {
      white: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 },
      black: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 },
    }

    board.forEach((row: any[]) => {
      row.forEach((piece: any) => {
        if (piece) {
          const color = piece.color === 'w' ? 'white' : 'black'
          const type = TYPE_MAP[piece.type]
          if (type) {
            piecesOnBoard[color][type]++
          }
        }
      })
    })

    // Starting piece counts
    const startingPieces = {
      pawn: 8,
      knight: 2,
      bishop: 2,
      rook: 2,
      queen: 1,
      king: 1,
    }

    // Calculate captured pieces
    Object.entries(startingPieces).forEach(([pieceType, count]) => {
      const type = pieceType as PieceType
      const whiteMissing = count - piecesOnBoard.white[type]
      const blackMissing = count - piecesOnBoard.black[type]

      for (let i = 0; i < whiteMissing; i++) {
        whiteCaptured.push(PIECES.white[type])
      }
      for (let i = 0; i < blackMissing; i++) {
        blackCaptured.push(PIECES.black[type])
      }
    })

    setCapturedPieces({ white: whiteCaptured, black: blackCaptured })

    // Calculate scores
    const whiteScore = whiteCaptured.reduce((sum, piece) => {
      const type = Object.entries(PIECES.white).find(([_, p]) => p === piece)?.[0] as PieceType
      return sum + (type ? PIECE_VALUES[type] : 0)
    }, 0)

    const blackScore = blackCaptured.reduce((sum, piece) => {
      const type = Object.entries(PIECES.black).find(([_, p]) => p === piece)?.[0] as PieceType
      return sum + (type ? PIECE_VALUES[type] : 0)
    }, 0)

    setScore({ white: whiteScore, black: blackScore })
  }, [])

  // ===== NEW DECOUPLED UPDATE FUNCTIONS =====

  /**
   * Update ONLY the visual board position from a FEN string
   * NO side effects on move history
   * Use for: Online games receiving broadcast/database events
   */
  const updateBoardPosition = useCallback((fen: string) => {
    chess.load(fen)
    const board = chess.board()
    const newBoardState: BoardState = []

    for (let row = 0; row < 8; row++) {
      const boardRow: (PieceSymbol | null)[] = []
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) {
          const color = piece.color === 'w' ? 'white' : 'black'
          const type = TYPE_MAP[piece.type]
          if (type) {
            boardRow.push(PIECES[color][type])
          } else {
            boardRow.push(null)
          }
        } else {
          boardRow.push(null)
        }
      }
      newBoardState.push(boardRow)
    }

    setBoardState(newBoardState)
    setCurrentPlayer(chess.turn() === 'w' ? 'white' : 'black')
    updateCapturedPieces(board)
  }, [chess, updateCapturedPieces])

  /**
   * Append ONLY a single move to history from database metadata
   * NO side effects on board position
   * Use for: Online games receiving database INSERT events
   */
  const appendMoveToHistory = useCallback((moveData: {
    from_square: string
    to_square: string
    san_notation: string
    piece: string
    captured_piece?: string
    promotion?: string
    move_number: number
  }) => {
    const fromCol = moveData.from_square.charCodeAt(0) - 97
    const fromRow = 8 - parseInt(moveData.from_square[1])
    const toCol = moveData.to_square.charCodeAt(0) - 97
    const toRow = 8 - parseInt(moveData.to_square[1])

    const pieceType = TYPE_MAP[moveData.piece.toLowerCase()]
    const moveColor = moveData.move_number % 2 === 1 ? 'white' : 'black'
    const piece = PIECES[moveColor][pieceType]

    const formattedMove: Move = {
      piece,
      notation: moveData.san_notation,
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      timestamp: Date.now(),
      ...(moveData.captured_piece && {
        captured: PIECES[moveColor === 'white' ? 'black' : 'white'][TYPE_MAP[moveData.captured_piece.toLowerCase()]]
      })
    }

    setMoveHistory(prev => {
      // Deduplicate: Check if this exact move already exists (same notation and position)
      const isDuplicate = prev.some(existingMove =>
        existingMove.notation === formattedMove.notation &&
        existingMove.from.row === formattedMove.from.row &&
        existingMove.from.col === formattedMove.from.col &&
        existingMove.to.row === formattedMove.to.row &&
        existingMove.to.col === formattedMove.to.col
      )

      if (isDuplicate) {
        return prev
      }

      return [...prev, formattedMove]
    })
  }, [])

  /**
   * Update BOTH board and history from chess.js instance
   * ONLY for offline games where chess.js is the source of truth
   * Use for: Offline games (vs friend, vs bot)
   */
  const updateBoardAndHistory = useCallback(() => {
    const board = chess.board()
    const newBoardState: BoardState = []

    for (let row = 0; row < 8; row++) {
      const boardRow: (PieceSymbol | null)[] = []
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) {
          const color = piece.color === 'w' ? 'white' : 'black'
          const type = TYPE_MAP[piece.type]
          if (type) {
            boardRow.push(PIECES[color][type])
          } else {
            boardRow.push(null)
          }
        } else {
          boardRow.push(null)
        }
      }
      newBoardState.push(boardRow)
    }

    setBoardState(newBoardState)
    setCurrentPlayer(chess.turn() === 'w' ? 'white' : 'black')

    // Rebuild history from chess.js
    const history = chess.history({ verbose: true })
    const formattedMoves: Move[] = history.map((move) => {
      const piece = PIECES[move.color === 'w' ? 'white' : 'black'][TYPE_MAP[move.piece]]
      const fromCol = move.from.charCodeAt(0) - 97
      const fromRow = 8 - parseInt(move.from[1])
      const toCol = move.to.charCodeAt(0) - 97
      const toRow = 8 - parseInt(move.to[1])

      return {
        piece,
        notation: move.san,
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        timestamp: Date.now(),
        ...(move.captured && { captured: PIECES[move.color === 'w' ? 'black' : 'white'][TYPE_MAP[move.captured]] }),
      }
    })
    setMoveHistory(formattedMoves)

    updateCapturedPieces(board)
  }, [chess, updateCapturedPieces])

  // Load move history from database for online games
  useEffect(() => {
    if (!opponent.isOnline || !gameId || historyLoaded) return

    async function loadMoveHistory() {
      try {
        // Load all moves for this game, ordered by move number
        const { data: moves, error } = await supabase
          .from('moves')
          .select('*')
          .eq('game_id', gameId)
          .order('move_number', { ascending: true })

        if (error) {
          console.error('Failed to load move history:', error)
          return
        }

        if (!moves || moves.length === 0) {
          console.log('[ChessGame] No move history to load')
          setHistoryLoaded(true)
          // No moves yet, just show initial position
          if (initialFen) {
            updateBoardPosition(initialFen)
          } else {
            updateBoardPosition(chess.fen())
          }
          return
        }

        console.log(`[ChessGame] Loading ${moves.length} historical moves`)

        // Get final position from last move's FEN
        const finalFen = moves[moves.length - 1].fen_after

        // Update board to final position
        updateBoardPosition(finalFen)

        // Build history from database moves
        moves.forEach(move => {
          appendMoveToHistory({
            from_square: move.from_square,
            to_square: move.to_square,
            san_notation: move.san_notation,
            piece: move.piece,
            captured_piece: move.captured_piece,
            promotion: move.promotion,
            move_number: move.move_number
          })
        })

        console.log('[ChessGame] Move history loaded successfully')
        setHistoryLoaded(true)
      } catch (err) {
        console.error('Failed to load move history:', err)
        // Fallback to loading FEN if history load fails
        if (initialFen) {
          updateBoardPosition(initialFen)
        } else {
          updateBoardPosition(chess.fen())
        }
        setHistoryLoaded(true)
      }
    }

    loadMoveHistory()
  }, [opponent.isOnline, gameId, historyLoaded, initialFen, chess, updateBoardPosition, appendMoveToHistory])

  // Initialize board from chess.js (for offline games)
  useEffect(() => {
    if (!opponent.isOnline) {
      updateBoardAndHistory()
    }
  }, [opponent.isOnline, updateBoardAndHistory])

  // Handle external game result (opponent resigned, timeout, etc.)
  useEffect(() => {
    if (externalGameResult && !gameOver) {
      setGameOver({
        winner: externalGameResult.winner,
        reason: externalGameResult.reason,
      })
      setTimerActive(false)
    }
  }, [externalGameResult, gameOver])

  // Subscribe to opponent moves - only run once on mount
  useEffect(() => {
    console.log('[ChessGame] Setting up opponent move subscription')

    const unsubscribe = opponent.onOpponentMove(async (move) => {
      console.log('[ChessGame] Received move event:', { source: move.source, from: move.from, to: move.to, player_id: move.player_id })

      const isOwnMove = user && move.player_id === user.id

      try {
        // For online games: Two types of events
        // 1. 'database' - Database INSERT with full metadata (for history)
        // 2. 'broadcast' - Real-time broadcast for instant board sync
        if (opponent.isOnline && move.fen) {

          // For database INSERTs: Append to history and update board (fallback)
          if (move.source === 'database' && move.san_notation) {
            console.log('[ChessGame] Database INSERT - Adding to history:', move.san_notation, isOwnMove ? '(own move)' : '(opponent move)')

            // Always append to history (both own and opponent moves)
            // This is the authoritative source for move history
            appendMoveToHistory({
              from_square: move.from_square || '',
              to_square: move.to_square || '',
              san_notation: move.san_notation,
              piece: move.piece || 'p',
              captured_piece: move.captured_piece,
              promotion: move.promotion,
              move_number: move.move_number || 1
            })

            // Only update board for opponent moves (our own board was already updated in applyMove)
            if (!isOwnMove) {
              updateBoardPosition(move.fen)
            }
          }
          // For broadcasts: Update board immediately for real-time sync
          else if (move.source === 'broadcast') {
            console.log('[ChessGame] Broadcast - Board sync only (history comes from database)')
            updateBoardPosition(move.fen)
          }
        } else {
          // Offline games: use chess.move() which preserves history
          chess.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion || 'q',
          })

          // Update board state with history rebuild from chess.js
          updateBoardAndHistory()
        }

        console.log('[ChessGame] Board updated after move')

        // Clear any selected pieces or hints
        setSelectedSquare(null)
        setValidMoves([])
        setHintSquares([])

        // Play appropriate sound
        if (chess.isCheckmate()) {
          playCheckmateSound()
          setGameOver({
            winner: chess.turn() === 'w' ? 'black' : 'white',
            reason: 'checkmate',
          })
        } else if (chess.isCheck()) {
          playCheckSound()
        } else if (chess.history({ verbose: true }).slice(-1)[0]?.captured) {
          playCaptureSound()
        } else {
          playMoveSound()
        }
      } catch (error) {
        console.error('Failed to apply opponent move:', error)
      }
    })

    return () => {
      console.log('[ChessGame] Cleaning up opponent move subscription')
      unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Convert row/col to algebraic notation (e.g., e2)
  const toAlgebraic = useCallback((row: number, col: number) => {
    const files = 'abcdefgh'
    return `${files[col]}${8 - row}`
  }, [])

  // Apply a move (handles both player and opponent moves)
  const applyMove = useCallback(
    async (fromRow: number, fromCol: number, toRow: number, toCol: number, promotionPiece?: PieceType) => {
      try {
        const from = toAlgebraic(fromRow, fromCol)
        const to = toAlgebraic(toRow, toCol)

        // Check if this is a pawn promotion
        const piece = chess.get(from as any)
        const isPromotion = piece?.type === 'p' && (toRow === 0 || toRow === 7)

        // If promotion and no piece selected, show modal
        if (isPromotion && !promotionPiece) {
          const color = chess.turn() === 'w' ? 'white' : 'black'
          setPromotionData({ row: toRow, col: toCol, color })
          // Store pending move for after promotion selection
          ;(window as any).__pendingPromotionMove = { from, to, fromRow, fromCol, toRow, toCol }
          return
        }

        // Make the move
        const move = chess.move({
          from,
          to,
          promotion: promotionPiece?.charAt(0) || 'q',
        })

        if (!move) {
          console.log('Invalid move')
          return
        }

        const newFen = chess.fen()

        // For online games: Update board only (history comes from database INSERT)
        // For offline games: Update both board and history from chess.js
        if (opponent.isOnline) {
          // Update board position immediately (optimistic update)
          updateBoardPosition(newFen)
          // DO NOT update history - database INSERT will trigger appendMoveToHistory
        } else {
          // Offline games: rebuild both from chess.js
          updateBoardAndHistory()
        }

        setLastMove({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } })

        // Send move to opponent (include FEN for bot to calculate from correct position)
        await opponent.sendMove({
          from,
          to,
          promotion: promotionPiece?.charAt(0),
          fen: newFen, // Current position after the move
        })

        // Check game state and play sounds
        if (chess.isCheckmate()) {
          playCheckmateSound()
          setGameOver({
            winner: chess.turn() === 'w' ? 'black' : 'white',
            reason: 'checkmate',
          })
        } else if (chess.isStalemate()) {
          setGameOver({ winner: 'draw', reason: 'stalemate' })
        } else if (chess.isDraw()) {
          setGameOver({ winner: 'draw', reason: 'draw' })
        } else if (chess.isCheck()) {
          playCheckSound()
        } else if (move.captured) {
          playCaptureSound()
        } else {
          playMoveSound()
        }

        // Start timer on first move
        if (chess.history().length === 1) {
          setTimerActive(true)
        }
      } catch (error) {
        console.error('Failed to apply move:', error)
      }
    },
    [chess, toAlgebraic, updateBoardPosition, updateBoardAndHistory, opponent, playMoveSound, playCaptureSound, playCheckSound, playCheckmateSound]
  )

  // Handle square click
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (gameOver) return

      // Online games: only allow moves if it's my turn
      if (opponent.isOnline && currentPlayer !== playerColor) {
        return
      }

      if (!selectedSquare) {
        // Select a piece
        const square = toAlgebraic(row, col)
        const piece = chess.get(square as any)

        if (piece && piece.color === chess.turn()) {
          setSelectedSquare({ row, col })

          // Calculate valid moves for this piece
          const moves = chess.moves({ square: square as any, verbose: true })
          const validSquares = moves.map((move) => {
            const col = move.to.charCodeAt(0) - 97
            const row = 8 - parseInt(move.to[1])
            return { row, col }
          })
          setValidMoves(validSquares)
        }
      } else {
        // Try to move the selected piece
        applyMove(selectedSquare.row, selectedSquare.col, row, col)
        setSelectedSquare(null)
        setValidMoves([])
      }
    },
    [selectedSquare, gameOver, opponent.isOnline, currentPlayer, playerColor, chess, toAlgebraic, applyMove]
  )

  // Handle drag start
  const handleDragStart = useCallback(
    (row: number, col: number) => {
      if (gameOver) return

      // Online games: only allow drag if it's my turn
      if (opponent.isOnline && currentPlayer !== playerColor) {
        return
      }

      const square = toAlgebraic(row, col)
      const piece = chess.get(square as any)

      if (piece && piece.color === chess.turn()) {
        setDraggedPiece({ row, col })

        // Calculate valid moves
        const moves = chess.moves({ square: square as any, verbose: true })
        const validSquares = moves.map((move) => {
          const col = move.to.charCodeAt(0) - 97
          const row = 8 - parseInt(move.to[1])
          return { row, col }
        })
        setValidMoves(validSquares)
      }
    },
    [gameOver, opponent.isOnline, currentPlayer, playerColor, chess, toAlgebraic]
  )

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle drop
  const handleDrop = useCallback(
    (row: number, col: number) => {
      if (draggedPiece) {
        applyMove(draggedPiece.row, draggedPiece.col, row, col)
        setDraggedPiece(null)
        setValidMoves([])
      }
    },
    [draggedPiece, applyMove]
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null)
    setValidMoves([])
  }, [])

  // Handle promotion selection
  const handlePromotion = useCallback(
    (pieceType: PieceType) => {
      setPromotionData(null)

      // Apply the pending promotion move
      const pending = (window as any).__pendingPromotionMove
      if (pending) {
        applyMove(pending.fromRow, pending.fromCol, pending.toRow, pending.toCol, pieceType)
        delete (window as any).__pendingPromotionMove
      }
    },
    [applyMove]
  )

  // Handle undo (offline only)
  const handleUndo = useCallback(() => {
    if (opponent.isOnline) return // No undo in online games

    // When playing vs bot, undo both bot's move AND player's move
    // This way player can retry their decision (bot's move is just a consequence)
    if (gameMode !== 'friend') {
      // Undo bot's last move
      chess.undo()
      // Undo player's last move
      chess.undo()
    } else {
      // Friend mode: just undo the last move (could be either player)
      chess.undo()
    }

    updateBoardAndHistory()
    setSelectedSquare(null)
    setValidMoves([])
    setHintSquares([])
    setLastMove(null) // Clear last move highlight
  }, [chess, opponent.isOnline, gameMode, updateBoardAndHistory])

  // Handle hint (offline only)
  const handleHint = useCallback(() => {
    if (opponent.isOnline) return // No hints in online games

    const moves = chess.moves({ verbose: true })
    if (moves.length > 0) {
      // Show a random valid move as a hint
      const randomMove = moves[Math.floor(Math.random() * moves.length)]
      const fromCol = randomMove.from.charCodeAt(0) - 97
      const fromRow = 8 - parseInt(randomMove.from[1])
      const toCol = randomMove.to.charCodeAt(0) - 97
      const toRow = 8 - parseInt(randomMove.to[1])

      setHintSquares([
        {
          from: { row: fromRow, col: fromCol },
          to: { row: toRow, col: toCol },
          rank: 'gold',
        },
      ])
    }
  }, [chess, opponent.isOnline])

  // Handle reset
  const handleResetClick = useCallback(() => {
    setShowResetConfirm(true)
  }, [])

  const handleResetConfirm = useCallback(() => {
    chess.reset()
    updateBoardAndHistory()
    setSelectedSquare(null)
    setValidMoves([])
    setHintSquares([])
    setLastMove(null)
    setGameOver(null)
    setPromotionData(null)
    setTimerActive(false)
    setWhiteTimeLeft(600)
    setBlackTimeLeft(600)
    setShowResetConfirm(false)
  }, [chess, updateBoardAndHistory])

  const handleResetCancel = useCallback(() => {
    setShowResetConfirm(false)
  }, [])

  // Handle forfeit (online only)
  const handleForfeitClick = useCallback(() => {
    setShowForfeitConfirm(true)
  }, [])

  const handleForfeitConfirm = useCallback(async () => {
    if (!opponent.isOnline || !gameId) return

    setShowForfeitConfirm(false)

    try {
      // Call resign-game API endpoint
      await resignGame(gameId)

      // Navigate to lobby immediately
      if (onForfeit) {
        onForfeit()
      }
    } catch (err) {
      console.error('Failed to resign game:', err)
      // Show error to user or retry
      alert('Failed to resign game. Please try again.')
      setShowForfeitConfirm(false)
    }
  }, [opponent.isOnline, gameId, onForfeit])

  const handleForfeitCancel = useCallback(() => {
    setShowForfeitConfirm(false)
  }, [])

  // Handle game over modal button (Return to Lobby for online, Play Again for offline)
  const handleGameOverAction = useCallback(() => {
    if (opponent.isOnline && onForfeit) {
      // For online games, navigate to lobby
      onForfeit()
    } else {
      // For offline games, reset the board
      handleResetConfirm()
    }
  }, [opponent.isOnline, onForfeit, handleResetConfirm])

  return (
    <div className="game-container">
      <div className="game-layout">
        {/* Left Side: Captured Pieces */}
        <div className="left-side-panel">
          <CapturedPieces
            color="black"
            capturedPieces={capturedPieces.black}
            score={score.black}
          />
          <CapturedPieces
            color="white"
            capturedPieces={capturedPieces.white}
            score={score.white}
          />
        </div>

        {/* Center: Chess Board */}
        <div className="board-container">
          <div className="board-wrapper">
            <ChessBoard
              boardState={boardState}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              draggedPiece={draggedPiece}
              lastMove={lastMove}
              hintSquares={hintSquares}
              onSquareClick={handleSquareClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              playerColor={playerColor}
            />
          </div>
        </div>

        {/* Right Side: Timers/Bot Chat and Move History */}
        <div className="right-side-panel">
          {/* Timers or Bot Chat based on game mode */}
          {gameMode === 'friend' || opponent.isOnline ? (
            <div className="timers-container">
              <Timer
                color={opponent.isOnline && playerColor === 'white' ? 'black' : 'black'}
                timeLeft={blackTimeLeft}
                isActive={timerActive && currentPlayer === 'black'}
              />
              <Timer
                color={opponent.isOnline && playerColor === 'white' ? 'white' : 'white'}
                timeLeft={whiteTimeLeft}
                isActive={timerActive && currentPlayer === 'white'}
              />
            </div>
          ) : (
            <BotChat
              moveCount={moveHistory.length}
              lastMove={moveHistory[moveHistory.length - 1]?.notation || ''}
              currentPlayer={currentPlayer}
              gameOver={!!gameOver}
              winner={gameOver?.winner || null}
              gameMode={gameMode}
              inCheck={chess.inCheck()}
              lastMoveCapture={moveHistory.length > 0 && moveHistory[moveHistory.length - 1]?.captured !== undefined}
              isComputerThinking={opponent.isThinking || false}
            />
          )}

          <div className="move-history-panel">
            <MoveHistory moves={moveHistory} />
          </div>

          {/* Game Controls - only for offline games */}
          {!opponent.isOnline && (
            <GameControls
              onUndo={handleUndo}
              onHint={handleHint}
              onReset={handleResetClick}
              canUndo={moveHistory.length > 0}
              gameMode={gameMode}
            />
          )}

          {/* Forfeit button - only for online games */}
          {opponent.isOnline && (
            <div className="online-game-controls">
              <button
                className="control-btn forfeit-btn"
                onClick={handleForfeitClick}
                disabled={!!gameOver}
              >
                Forfeit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {promotionData && (
        <PromotionModal
          color={promotionData.color}
          onSelect={handlePromotion}
        />
      )}

      {gameOver && (
        <GameOverModal
          winner={gameOver.winner}
          reason={gameOver.reason}
          onReset={handleGameOverAction}
          isOnline={opponent.isOnline}
          playerColor={playerColor}
        />
      )}

      {showForfeitConfirm && (
        <ConfirmationModal
          title="Forfeit Game?"
          message="Are you sure you want to forfeit? This will count as a loss."
          confirmText="Forfeit"
          cancelText="Cancel"
          onConfirm={handleForfeitConfirm}
          onCancel={handleForfeitCancel}
        />
      )}

      {showResetConfirm && (
        <ConfirmationModal
          title="Reset Game?"
          message="Are you sure you want to reset? All progress will be lost."
          confirmText="Reset"
          cancelText="Cancel"
          onConfirm={handleResetConfirm}
          onCancel={handleResetCancel}
        />
      )}
    </div>
  )
}
