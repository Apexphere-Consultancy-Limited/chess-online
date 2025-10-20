import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Game as GameType } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useSupabaseOpponent } from '../hooks/useSupabaseOpponent'
import { playerReady } from '../hooks/useMakeMove'
import ChessGame from '../components/ChessGame'
import ReadyOverlay from '../components/ReadyOverlay'
import NavBar from '../components/NavBar'
import '../styles/style.css'

/**
 * OnlineGamePage - Wrapper for online multiplayer games
 *
 * Responsibilities:
 * - Load game data from database
 * - Determine player's color
 * - Handle timer synchronization
 * - Pass opponent instance to ChessGame
 */
export default function OnlineGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [game, setGame] = useState<GameType | null>(null)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNavbar, setShowNavbar] = useState(true)
  const [readyLoading, setReadyLoading] = useState(false)

  // Create opponent instance
  const opponent = gameId ? useSupabaseOpponent(gameId) : null

  // Handle forfeit - navigate back to lobby
  const handleForfeit = useCallback(() => {
    navigate('/online')
  }, [navigate])

  // Handle ready button click
  const handleReady = useCallback(async () => {
    if (!gameId || !game) return

    // Check if ready period expired
    if (game.ready_expires_at) {
      const expiresAt = new Date(game.ready_expires_at)
      if (expiresAt < new Date()) {
        alert('Ready period has expired. Returning to lobby...')
        navigate('/online')
        return
      }
    }

    setReadyLoading(true)
    try {
      const result = await playerReady(gameId)
      console.log('Ready result:', result)

      // Immediately update local game state with the response
      // Don't wait for realtime subscription for better UX
      if (result.game && game) {
        setGame({
          ...game,
          white_ready: result.game.whiteReady,
          black_ready: result.game.blackReady,
          status: result.game.status,
        })
      }
    } catch (err) {
      console.error('Failed to mark ready:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'

      if (errorMessage.includes('Ready period has expired')) {
        alert('Ready period has expired. Returning to lobby...')
        navigate('/online')
      } else if (errorMessage.includes('not in waiting status')) {
        // Game already started or ended - reload game state
        console.log('Game status changed, reloading...')
      } else {
        alert(`Failed to mark ready: ${errorMessage}`)
      }
    } finally {
      setReadyLoading(false)
    }
  }, [gameId, game, navigate])

  // Auto-hide navbar after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNavbar(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Load game data from database
  useEffect(() => {
    if (!gameId || !user) return

    async function loadGame() {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single()

        if (error || !data) {
          console.error('Failed to load game:', error)
          setError('Game not found')
          setLoading(false)
          return
        }

        console.log('[OnlineGamePage] Game loaded:', {
          id: data.id,
          status: data.status,
          white_ready: data.white_ready,
          black_ready: data.black_ready,
          ready_expires_at: data.ready_expires_at,
        })

        setGame(data)

        // Determine player's color
        const color = data.white_player_id === user.id ? 'white' : 'black'
        setPlayerColor(color)

        setLoading(false)
      } catch (err) {
        console.error('Failed to load game:', err)
        setError('Failed to load game')
        setLoading(false)
      }
    }

    loadGame()
  }, [gameId, user])

  // Subscribe to game updates (for status changes, timer updates, etc.)
  useEffect(() => {
    if (!gameId) return

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log('Game updated:', payload)
          if (payload.new) {
            const updatedGame = payload.new as GameType
            setGame(updatedGame)

            // If game is completed and it's due to resignation, show notification
            if (updatedGame.status === 'completed' && updatedGame.termination_type === 'resignation') {
              // The ChessGame component will handle showing the game over modal
              // based on the updated game state we'll pass to it
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading game...
      </div>
    )
  }

  if (error || !opponent) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Error</h2>
        <p>{error || 'Failed to initialize game'}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    )
  }

  if (!game) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Game not found
      </div>
    )
  }

  const isWaitingForReady = game.status === 'waiting'
  const isPlayerReady = playerColor === 'white' ? game.white_ready : game.black_ready
  const isOpponentReady = playerColor === 'white' ? game.black_ready : game.white_ready

  return (
    <>
      <div className={`game-top-nav ${showNavbar ? 'show' : ''}`}>
        <NavBar />
      </div>

      <div style={{ position: 'relative' }}>
        <ChessGame
          opponent={opponent}
          playerColor={playerColor}
          gameMode="friend" // Not used for online games, but required by interface
          gameId={gameId}
          initialFen={game.current_fen}
          onForfeit={handleForfeit}
          externalGameResult={
            game.status === 'completed'
              ? {
                  winner: game.winner_id === user?.id
                    ? playerColor
                    : playerColor === 'white' ? 'black' : 'white',
                  reason: game.termination_type || 'unknown',
                }
              : undefined
          }
        />

        {isWaitingForReady && (
          <ReadyOverlay
            onReady={handleReady}
            isReady={isPlayerReady || false}
            opponentReady={isOpponentReady || false}
            loading={readyLoading}
          />
        )}
      </div>
    </>
  )
}
