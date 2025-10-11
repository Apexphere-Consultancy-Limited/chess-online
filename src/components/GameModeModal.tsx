import { GameMode } from '../types/chess'

interface GameModeModalProps {
  onSelectMode: (mode: GameMode) => void
  onClose?: () => void
}

function GameModeModal({ onSelectMode, onClose }: GameModeModalProps) {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  return (
    <div className="game-mode-modal" id="gameModeModal" onClick={handleBackdropClick}>
      <div className="game-mode-dialog">
        <div className="game-mode-title">🏁 Choose Game Mode</div>
        <div className="game-mode-subtitle">
          Select how you want to play this chess game!
        </div>
        <div className="game-mode-buttons" id="gameModeButtons">
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
