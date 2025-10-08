interface GameControlsProps {
  onUndo: () => void
  onHint: () => void
  onReset: () => void
  canUndo: boolean
  gameMode: string
}

function GameControls({ onUndo, onHint, onReset, canUndo, gameMode }: GameControlsProps) {
  return (
    <div className="game-controls">
      <button
        className="control-btn"
        id="undoBtn"
        onClick={onUndo}
        disabled={!canUndo || gameMode === 'friend'}
      >
        Undo Move
      </button>
      <button
        className="control-btn hint-btn"
        id="hintBtn"
        onClick={onHint}
      >
        💡 Get Hint
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
