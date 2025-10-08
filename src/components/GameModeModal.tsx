import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameMode } from '../types/chess'
import { useAuth } from '../auth/AuthProvider'
import { createGame } from '../hooks/useCreateGame'

interface GameModeModalProps {
  onSelectMode: (mode: GameMode) => void
}

function GameModeModal({ onSelectMode }: GameModeModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showOnlineForm, setShowOnlineForm] = useState(false)
  const [opponentUsername, setOpponentUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreateOnlineGame(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await createGame(opponentUsername)
      navigate(`/game/${result.game.id}`)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  if (showOnlineForm) {
    return (
      <div className="game-mode-modal" id="gameModeModal">
        <div className="game-mode-dialog">
          <div className="game-mode-title">🌐 Play Online</div>
          <div className="game-mode-subtitle">
            Enter your opponent's username to challenge them
          </div>

          <form onSubmit={handleCreateOnlineGame} style={{ padding: '1rem' }}>
            {error && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: '#fee',
                border: '1px solid #fcc',
                color: '#c00',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#333'
              }}>
                Opponent Username
              </label>
              <input
                type="text"
                value={opponentUsername}
                onChange={(e) => setOpponentUsername(e.target.value)}
                required
                placeholder="Enter username"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #ddd',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#81b64c'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowOnlineForm(false)
                  setError('')
                  setOpponentUsername('')
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #ddd',
                  background: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: loading ? '#999' : '#81b64c',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : 'Challenge'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="game-mode-modal" id="gameModeModal">
      <div className="game-mode-dialog">
        <div className="game-mode-title">🏁 Choose Game Mode</div>
        <div className="game-mode-subtitle">
          Select how you want to play this chess game!
        </div>
        <div className="game-mode-buttons" id="gameModeButtons">
          {user && (
            <button className="mode-btn mode-btn-featured" onClick={() => setShowOnlineForm(true)}>
              <div className="mode-title">🌐 Play Online (PvP)</div>
              <div className="mode-description">Challenge another player in real-time</div>
            </button>
          )}
          <button className="mode-btn" onClick={() => onSelectMode('friend')}>
            <div className="mode-title">👥 Play with Friend</div>
            <div className="mode-description">Two human players on same device</div>
          </button>
          <button className="mode-btn" onClick={() => onSelectMode('ai-easy')}>
            <div className="mode-title">🤖 Play with AI (Easy)</div>
            <div className="mode-description">Challenge the computer - it makes random moves!</div>
          </button>
          <button className="mode-btn" onClick={() => onSelectMode('ai-medium')}>
            <div className="mode-title">🧠 Play with AI (Medium)</div>
            <div className="mode-description">Stockfish engine with moderate thinking depth</div>
          </button>
          <button className="mode-btn" onClick={() => onSelectMode('ai-hard')}>
            <div className="mode-title">🔥 Play with AI (Hard)</div>
            <div className="mode-description">Stockfish engine with deep analysis - very challenging!</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameModeModal
