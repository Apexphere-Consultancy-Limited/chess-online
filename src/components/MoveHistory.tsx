import { Move } from '../types/chess'

interface MoveHistoryProps {
  moves: Move[]
}

function MoveHistory({ moves }: MoveHistoryProps) {
  // Group moves into pairs (white, black)
  const movePairs: Array<{ white: Move; black?: Move; number: number }> = []
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      white: moves[i],
      black: moves[i + 1],
      number: Math.floor(i / 2) + 1,
    })
  }

  return (
    <>
      <h3 className="history-title">📝 Move History</h3>
      <div className="move-history-content" id="moveHistory">
        {moves.length === 0 ? (
          <div className="no-moves">No moves yet. Make your first move!</div>
        ) : (
          <div className="moves-list">
            {movePairs.map((pair, index) => (
              <div key={index} className="move-entry">
                <span className="move-number">{pair.number}.</span>
                <span className="move-column">
                  <span className="move-piece">{pair.white.piece}</span>
                  <span className="move-notation">{pair.white.notation}</span>
                </span>
                {pair.black && (
                  <span className="move-column">
                    <span className="move-piece">{pair.black.piece}</span>
                    <span className="move-notation">{pair.black.notation}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default MoveHistory
