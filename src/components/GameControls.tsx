import { Undo2, Lightbulb, Flag } from 'lucide-react'

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
        className="control-btn icon-btn"
        id="undoBtn"
        onClick={onUndo}
        disabled={!canUndo}
        title={gameMode === 'friend' ? 'Undo Last Move' : 'Undo Your Move'}
      >
        <Undo2 size={20} />
      </button>
      <button
        className="control-btn hint-btn icon-btn"
        id="hintBtn"
        onClick={onHint}
        title="Get Hint"
      >
        <Lightbulb size={20} />
      </button>
      <button
        className="control-btn reset-btn icon-btn"
        id="resetBtn"
        onClick={onReset}
        title="Reset Game"
      >
        <Flag size={20} />
      </button>
    </div>
  )
}

export default GameControls
