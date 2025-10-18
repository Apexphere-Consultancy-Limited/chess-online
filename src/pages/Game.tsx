import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import GameModeModal from '../components/GameModeModal'
import ChessGame from '../components/ChessGame'
import { useLocalOpponent } from '../hooks/useLocalOpponent'
import type { OpponentConfig } from '../types/gameOpponent'
import NavBar from '../components/NavBar'
import OnlineGame from '../components/OnlineGame'
import { useAuth } from '../auth/AuthProvider'

function Game() {
  const { gameId } = useParams<{ gameId: string }>()
  const { user, loading } = useAuth()

  // Apply game-page class for all games
  useEffect(() => {
    document.body.classList.add('game-page')
    return () => {
      document.body.classList.remove('game-page')
    }
  }, [])

  // Handle online game
  if (gameId) {
    if (loading) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Checking authentication...
        </div>
      )
    }

    if (!user) {
      const redirectTo = encodeURIComponent(`/online/${gameId}`)
      return <Navigate to={`/login?redirect=${redirectTo}`} replace />
    }

    return <OnlineGame />
  }

  // Otherwise, render local game (vs Friend or vs AI)
  return <LocalGame />
}

function LocalGame() {
  const [showNavbar, setShowNavbar] = useState(true)
  const [showModal, setShowModal] = useState(true)
  const [opponentConfig, setOpponentConfig] = useState<Exclude<OpponentConfig, { type: 'online' }> | null>(null)

  useEffect(() => {
    // Auto-hide navbar after 3 seconds
    const timer = setTimeout(() => {
      setShowNavbar(false)
    }, 3000)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // If no game mode selected, show modal
  if (!opponentConfig) {
    return (
      <>
        {/* Auto-hide top navigation */}
        <div className={`game-top-nav ${showNavbar ? 'show' : ''}`}>
          <NavBar />
        </div>

        {showModal && (
          <GameModeModal
            onSelectMode={(mode) => {
              // Convert game mode to opponent config
              if (mode === 'friend') {
                setOpponentConfig({ type: 'friend' })
              } else if (mode === 'ai-easy') {
                setOpponentConfig({ type: 'bot', difficulty: 'easy' })
              } else if (mode === 'ai-medium') {
                setOpponentConfig({ type: 'bot', difficulty: 'medium' })
              } else if (mode === 'ai-hard') {
                setOpponentConfig({ type: 'bot', difficulty: 'hard' })
              }
              setShowModal(false)
            }}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  return <GameView config={opponentConfig} />
}

// Separate component to avoid conditional hook calls
function GameView({
  config
}: {
  config: Exclude<OpponentConfig, { type: 'online' }>
}) {
  const [showNavbar, setShowNavbar] = useState(true)
  const [chessInstance] = useState(() => new Chess())
  const [boardState] = useState(() => {
    // Initialize 8x8 board from chess.js
    const board = Array(8).fill(null).map(() => Array(8).fill(null))
    const fen = chessInstance.fen()
    const rows = fen.split(' ')[0].split('/')

    rows.forEach((row, rowIndex) => {
      let colIndex = 0
      for (const char of row) {
        if (char >= '1' && char <= '8') {
          colIndex += parseInt(char)
        } else {
          board[rowIndex][colIndex] = char
          colIndex++
        }
      }
    })

    return board
  })

  useEffect(() => {
    // Auto-hide navbar after 3 seconds
    const timer = setTimeout(() => {
      setShowNavbar(false)
    }, 3000)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // Create opponent using unified hook
  const opponent = useLocalOpponent(config, boardState, chessInstance)

  // Determine game mode for ChessGame component
  const gameMode = config.type === 'friend'
    ? 'friend'
    : config.difficulty === 'easy'
      ? 'ai-easy'
      : config.difficulty === 'medium'
        ? 'ai-medium'
        : 'ai-hard'

  return (
    <>
      {/* Auto-hide top navigation (shows for 3 seconds on page load) */}
      <div className={`game-top-nav ${showNavbar ? 'show' : ''}`}>
        <NavBar />
      </div>

      <ChessGame
        opponent={opponent}
        playerColor="white"
        gameMode={gameMode}
      />
    </>
  )
}

export default Game
