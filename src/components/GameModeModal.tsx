import { GameMode } from '../types/chess'

interface GameModeModalProps {
  onSelectMode: (mode: GameMode) => void
}

function GameModeModal({ onSelectMode }: GameModeModalProps) {
  return (
    <div className="game-mode-modal" id="gameModeModal">
      <div className="game-mode-dialog">
        <div className="game-mode-title">🏁 Choose Game Mode</div>
        <div className="game-mode-subtitle">
          Select how you want to play this chess game!
        </div>
        <div className="game-mode-buttons" id="gameModeButtons">
          <button className="mode-btn" onClick={() => onSelectMode('friend')}>
            <div className="mode-title">👥 Play with Friend</div>
            <div className="mode-description">Two human players take turns</div>
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
