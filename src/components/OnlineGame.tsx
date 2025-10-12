import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Chess } from 'chess.js'
import { Flag } from 'lucide-react'
import { supabase, Game as GameType } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useGameRealtime, RealtimeMovePayload } from '../hooks/useGameRealtime'
import { makeMove } from '../hooks/useMakeMove'
import ChessBoard from './ChessBoard'
import NavBar from './NavBar'
import MoveHistory from './MoveHistory'
import { PIECES } from '../types/chess'
import type { BoardState, PieceSymbol, PieceType, Move } from '../types/chess'
import { initializeSounds } from '../utils/soundEffects'

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
  const [showNavbar, setShowNavbar] = useState(true)
  const [moveHistory, setMoveHistory] = useState<Move[]>([])

  // Auto-hide navbar after 3 seconds and initialize sounds
  useEffect(() => {
    // Initialize sounds when game starts
    initializeSounds()

    const timer = setTimeout(() => {
      setShowNavbar(false)
    }, 3000)

    return () => {
      clearTimeout(timer)
    }
  }, [])

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

    // Update move history
    const history = chess.history({ verbose: true })
    const formattedMoves: Move[] = history.map((move) => {
      const piece = PIECES[move.color === 'w' ? 'white' : 'black'][TYPE_MAP[move.piece]]
      return {
        piece,
        notation: move.san,
        from: move.from,
        to: move.to,
      }
    })
    setMoveHistory(formattedMoves)
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

  async function handleForfeit() {
    if (!game || !user || !gameId) return

    const confirmed = window.confirm('Are you sure you want to forfeit this game?')
    if (!confirmed) return

    try {
      const winner = playerColor === 'white' ? 'black' : 'white'
      await supabase
        .from('games')
        .update({
          status: 'completed',
          result: `${winner} wins by forfeit`,
          winner: winner,
        })
        .eq('id', gameId)

      // Refresh game data
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (data) setGame(data)
    } catch (err) {
      console.error('Failed to forfeit:', err)
      setError('Failed to forfeit game')
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
      <div className={`game-top-nav ${showNavbar ? 'show' : ''}`}>
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
                lastMove={null}
                hintSquares={[]}
                onSquareClick={handleSquareClick}
                onDragStart={() => {}}
                onDragOver={() => {}}
                onDrop={() => {}}
                onDragEnd={() => {}}
              />
            </div>
          </div>

          {/* Right Side: Move History and Controls */}
          <div className="right-side-panel">
            <div className="move-history-panel">
              <MoveHistory moves={moveHistory} />
            </div>

            <div className="online-game-controls">
              <button
                className="control-btn forfeit-btn icon-btn"
                onClick={handleForfeit}
                disabled={game.status === 'completed'}
                title="Forfeit Game"
              >
                <Flag size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
