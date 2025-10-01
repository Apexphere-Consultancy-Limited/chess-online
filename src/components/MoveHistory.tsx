import { Move } from '../types/chess'

interface MoveHistoryProps {
  moves: Move[]
}

function MoveHistory({ moves }: MoveHistoryProps) {
  return (
    <>
      <h3 className="history-title">📝 Move History</h3>
      <div className="move-history-content" id="moveHistory">
        {moves.length === 0 ? (
          <div className="no-moves">No moves yet. Make your first move!</div>
        ) : (
          <div className="moves-list">
            {moves.map((move, index) => (
              <div key={index} className="move-entry">
                <span className="move-number">{index + 1}.</span>
                <span className="move-piece">{move.piece}</span>
                <span className="move-notation">{move.notation}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default MoveHistory
