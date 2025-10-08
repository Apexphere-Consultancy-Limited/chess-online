import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { supabase, Game as GameType } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useGameRealtime, RealtimeMovePayload } from '../hooks/useGameRealtime'
import { makeMove } from '../hooks/useMakeMove'
import ChessBoard from './ChessBoard'
import NavBar from './NavBar'
import { PIECES } from '../types/chess'
import type { BoardState, PieceSymbol, PieceType } from '../types/chess'

const TYPE_MAP: Record<string, PieceType> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

export default function OnlineGame() {
  const { gameId } = useParams<{ gameId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [game, setGame] = useState<GameType | null>(null)
  const [chess] = useState(new Chess())
  const [boardState, setBoardState] = useState<BoardState>(() =>
    Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => null)
    )
  )
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null)
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const lastProcessedFenRef = useRef<string | null>(null)

  // Load game data
  useEffect(() => {
    if (!gameId || !user) return

    async function loadGame() {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (error || !data) {
        console.error('Failed to load game:', error)
        setError('Game not found')
        return
      }

      setGame(data)
      chess.load(data.current_fen)
      updateBoardState()
      lastProcessedFenRef.current = data.current_fen

      // Determine player's color
      const color = data.white_player_id === user.id ? 'white' : 'black'
      setPlayerColor(color)
    }

    loadGame()
  }, [gameId, user, navigate])

  // Handle move updates with useCallback to prevent re-subscriptions
  const handleMoveUpdate = useCallback((move: RealtimeMovePayload) => {
    const fenAfter = move.fen_after
    if (!fenAfter) {
      return
    }

    if (lastProcessedFenRef.current === fenAfter) {
      return
    }

    lastProcessedFenRef.current = fenAfter
    console.log('Move update received:', move)
    chess.load(fenAfter)
    updateBoardState()
    setSelectedSquare(null)
    setValidMoves([])

    setGame((prev) => {
      if (!prev) return prev

      const moverId = move.player_id
      if (!moverId) {
        return {
          ...prev,
          current_fen: fenAfter,
        }
      }

      const isWhiteMove = moverId === prev.white_player_id

      return {
        ...prev,
        current_fen: fenAfter,
        current_turn: isWhiteMove ? 'black' : 'white',
      }
    })

    // Reload game data to get updated status
    supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()
      .then(({ data }) => {
        if (data) setGame(data)
      })
      .catch((err) => {
        console.error('Failed to refresh game after move:', err)
      })
  }, [chess, gameId])

  // Subscribe to move updates
  const moveChannel = useGameRealtime(gameId!, handleMoveUpdate)

  function updateBoardState() {
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
  }

  async function handleSquareClick(row: number, col: number) {
    if (!game || !user) return

    // Check if it's player's turn
    if (game.current_turn !== playerColor) {
      return
    }

    // If a square is already selected, try to move
    if (selectedSquare) {
      const from = `${String.fromCharCode(97 + selectedSquare.col)}${8 - selectedSquare.row}`
      const to = `${String.fromCharCode(97 + col)}${8 - row}`

      // Try move locally first (optimistic update)
      const move = chess.move({ from, to, promotion: 'q' as const })

      if (move) {
        const newFen = chess.fen()
        const previousGame = game

        updateBoardState()
        setSelectedSquare(null)
        setValidMoves([])

        setGame((prev) => {
          if (!prev) return prev
          const nextTurn = prev.current_turn === 'white' ? 'black' : 'white'
          return {
            ...prev,
            current_fen: newFen,
            current_turn: nextTurn,
          }
        })

        try {
          await makeMove(gameId!, from, to, 'q')

          if (moveChannel && moveChannel.state === 'joined') {
            const result = await moveChannel.send({
              type: 'broadcast',
              event: 'move',
              payload: {
                fen_after: newFen,
                player_id: user.id,
                move_number: chess.history().length,
              },
            })

            if (result !== 'ok') {
              console.warn('Move broadcast not acknowledged:', result)
            }
          } else {
            console.warn('Move channel not ready; skipping broadcast')
          }
        } catch (err: any) {
          console.error('Move rejected:', err)
          setError('Move rejected: ' + err.message)
          // Rollback
          chess.undo()
          updateBoardState()
          lastProcessedFenRef.current = chess.fen()
          if (previousGame) {
            setGame(previousGame)
          }
        }
      } else {
        setSelectedSquare(null)
        setValidMoves([])
      }
    } else {
      // Select a square
      const boardMatrix = chess.board()
      const piece = boardMatrix[row][col]
      if (piece && piece.color === playerColor.charAt(0)) {
        setSelectedSquare({ row, col })

        // Calculate valid moves
        const square = `${String.fromCharCode(97 + col)}${8 - row}`
        const moves = chess.moves({ square, verbose: true })
        const validMoveSquares = moves.map((m: any) => {
          const toFile = m.to.charCodeAt(0) - 97
          const toRank = 8 - parseInt(m.to[1])
          return { row: toRank, col: toFile }
        })
        setValidMoves(validMoveSquares)
      }
    }
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    )
  }

  if (!game) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading game...</div>
  }

  return (
    <>
      <div className="game-top-nav show">
        <NavBar />
      </div>

      <div className="game-container">
        <div className="game-layout">
          <div className={`turn-indicator ${game.current_turn}-turn`}>
            {game.status === 'completed' ? (
              <span>Game Over - {game.result}</span>
            ) : (
              <>
                You are playing as: {playerColor}
                <br />
                Current turn: {game.current_turn}
                {game.current_turn === playerColor && <span> (Your turn!)</span>}
              </>
            )}
          </div>

          <div className="board-container">
            <div className="board-wrapper">
              <ChessBoard
                boardState={boardState}
                selectedSquare={selectedSquare}
                validMoves={validMoves}
                draggedPiece={null}
                onSquareClick={handleSquareClick}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDrop={() => {}}
                onDragEnd={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
