interface GameControlsProps {
  onUndo: () => void
  onHint: () => void
  onReset: () => void
  hintsRemaining: number
  canUndo: boolean
}

function GameControls({ onUndo, onHint, onReset, hintsRemaining, canUndo }: GameControlsProps) {
  return (
    <div className="game-controls">
      <button
        className="control-btn"
        id="undoBtn"
        onClick={onUndo}
        disabled={!canUndo}
      >
        Undo Move
      </button>
      <button
        className="control-btn hint-btn"
        id="hintBtn"
        onClick={onHint}
        disabled={hintsRemaining === 0}
      >
        💡 Get Hint (<span id="hintsLeft">{hintsRemaining}</span> left)
      </button>
      <button
        className="control-btn reset-btn"
        id="resetBtn"
        onClick={onReset}
      >
        Reset Game
      </button>
    </div>
  )
}

export default GameControls
