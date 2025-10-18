import { useState } from 'react'
import { Chess } from 'chess.js'
import ChessGame from '../components/ChessGame'
import { useLocalOpponent } from '../hooks/useLocalOpponent'
import type { OpponentConfig } from '../types/gameOpponent'
import '../styles/style.css'

export default function TestGame() {
  const [opponentConfig, setOpponentConfig] = useState<Exclude<OpponentConfig, { type: 'online' }> | null>(null)

  const startGame = (config: Exclude<OpponentConfig, { type: 'online' }>) => {
    setOpponentConfig(config)
  }

  const backToMenu = () => {
    setOpponentConfig(null)
  }

  if (!opponentConfig) {
    return (
      <div className="test-game-container" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '3rem',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
            color: '#2d3748',
            textAlign: 'center',
          }}>
            Test Chess Game
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#718096',
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            Testing the new unified ChessGame component
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <button
              onClick={() => startGame({ type: 'friend' })}
              style={{
                padding: '1.5rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              👥 Play vs Friend (Local)
            </button>

            <button
              onClick={() => startGame({ type: 'bot', difficulty: 'easy' })}
              style={{
                padding: '1.5rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(72, 187, 120, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              🤖 Play vs Easy Bot
            </button>

            <button
              onClick={() => startGame({ type: 'bot', difficulty: 'medium' })}
              style={{
                padding: '1.5rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(237, 137, 54, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              🧠 Play vs Medium Bot
            </button>

            <button
              onClick={() => startGame({ type: 'bot', difficulty: 'hard' })}
              style={{
                padding: '1.5rem',
                fontSize: '1.2rem',
                background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(229, 62, 62, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              🔥 Play vs Hard Bot
            </button>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#edf2f7',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#4a5568',
          }}>
            <strong>Test Features:</strong>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <li>Click to move & drag-and-drop</li>
              <li>Undo moves (offline only)</li>
              <li>Hints system (offline only)</li>
              <li>Sound effects</li>
              <li>Promotion modal</li>
              <li>Game reset</li>
            </ul>
          </div>

          <a
            href="/"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '2rem',
              color: '#667eea',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    )
  }

  // Now render the actual game with the selected config
  return <GameView config={opponentConfig} onBackToMenu={backToMenu} />
}

// Separate component to avoid conditional hook calls
function GameView({
  config,
  onBackToMenu
}: {
  config: Exclude<OpponentConfig, { type: 'online' }>
  onBackToMenu: () => void
}) {
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

  // Now we can safely call the hook since it's not conditional
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
    <div style={{ minHeight: '100vh', background: '#1a202c' }}>
      <div style={{
        padding: '1rem',
        background: 'rgba(102, 126, 234, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <button
          onClick={onBackToMenu}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
          }}
        >
          ← Back to Menu
        </button>
      </div>

      <ChessGame
        opponent={opponent}
        playerColor="white"
        gameMode={gameMode}
      />
    </div>
  )
}
