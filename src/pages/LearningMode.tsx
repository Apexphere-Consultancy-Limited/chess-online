import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ChessBoard from '../components/ChessBoard'
import { BoardState, Position } from '../types/chess'
import { getValidMoves, isValidMove, isCheckmate } from '../utils/chess'

interface CheckmatePuzzle {
  id: number
  title: string
  description: string
  board: BoardState
  solution: string
  currentPlayer: 'white' | 'black'
}

const CHECKMATE_PUZZLES: CheckmatePuzzle[] = [
  {
    id: 1,
    title: "Back Rank Mate",
    description: "Checkmate in one move! The enemy king is trapped on the back rank.",
    board: [
      [null, null, null, null, '♜', '♚', null, null],
      [null, null, null, null, '♟', '♟', '♟', null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, '♔', '♖'],
    ],
    solution: "Move the white rook from h1 to h8 for checkmate! The black king on f8 cannot escape - e8 is blocked by its own rook, and e7, f7, g7 are blocked by its own pawns.",
    currentPlayer: 'white'
  },
  {
    id: 2,
    title: "Queen and King Mate",
    description: "Checkmate in one move! Coordinate your queen and king to trap the enemy monarch in the corner.",
    board: [
      [null, null, null, null, null, null, null, '♚'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, '♔', '♕', null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    solution: "Move the white queen from g6 to g7 for checkmate! The black king on h8 is trapped: your king on f6 defends g7, while the queen controls g8 and h7.",
    currentPlayer: 'white'
  },
  {
    id: 3,
    title: "Scholar's Mate",
    description: "Checkmate in two moves! First attack f7, then deliver mate.",
    board: [
      ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
      ['♟', '♟', '♟', '♟', null, '♟', '♟', '♟'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, '♟', null, null, null],
      [null, null, '♗', null, '♙', null, null, null],
      [null, null, null, null, null, null, null, null],
      ['♙', '♙', '♙', '♙', null, '♙', '♙', '♙'],
      ['♖', '♘', null, '♕', '♔', null, '♘', '♖'],
    ],
    solution: "Move 1: Queen from d1 to h5 (attacks f7 and e8). Move 2: Queen takes f7 for checkmate! The black king on e8 cannot escape - your bishop on c4 also attacks f7, and the queen controls all escape squares.",
    currentPlayer: 'white'
  },
  {
    id: 4,
    title: "Smothered Mate",
    description: "Checkmate in one move! The knight delivers a special checkmate.",
    board: [
      [null, null, null, null, null, '♜', '♚', null],
      [null, null, null, null, null, '♟', '♟', '♟'],
      [null, null, null, null, null, null, '♘', null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, '♔'],
    ],
    solution: "Move the white knight from g6 to f8 for checkmate! The black king on g8 is 'smothered' - it cannot move to f8 (knight), f7 (pawn), g7 (pawn), h7 (pawn), or h8 (pawn). This is called a smothered mate!",
    currentPlayer: 'white'
  },
  {
    id: 5,
    title: "Rook Roller",
    description: "Checkmate in one move! One rook delivers mate while the other cuts off escape.",
    board: [
      ['♚', null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['♖', null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['♖', null, null, null, null, null, null, '♔'],
    ],
    solution: "Move the white rook from a1 to b1 for checkmate! The black king on a8 cannot escape: a7 is blocked by the rook on a6, and b8/b7 are controlled by your rook on b1. Classic two-rook checkmate!",
    currentPlayer: 'white'
  },
  {
    id: 6,
    title: "Queen Hunt",
    description: "Checkmate in one move! The queen is powerful close to the enemy king.",
    board: [
      [null, null, null, null, '♚', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, '♔', null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, '♕'],
    ],
    solution: "Move the white queen from h1 to e1 for checkmate! The black king on e8 is trapped: your king on e6 controls d7, e7, and f7. The queen on e1 checks the king and controls d8 and f8. No escape!",
    currentPlayer: 'white'
  }
]

function LearningMode() {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [boardState, setBoardState] = useState<BoardState>(CHECKMATE_PUZZLES[0].board)
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [showCelebration, setShowCelebration] = useState(false)

  const currentPuzzle = CHECKMATE_PUZZLES[currentPuzzleIndex]

  // Check for checkmate after each move
  useEffect(() => {
    const opponentColor = currentPuzzle.currentPlayer === 'white' ? 'black' : 'white'
    if (isCheckmate(opponentColor, boardState)) {
      setShowCelebration(true)
    }
  }, [boardState, currentPuzzle.currentPlayer])

  const handleNext = () => {
    if (currentPuzzleIndex < CHECKMATE_PUZZLES.length - 1) {
      const nextIndex = currentPuzzleIndex + 1
      setCurrentPuzzleIndex(nextIndex)
      setBoardState(CHECKMATE_PUZZLES[nextIndex].board)
      setShowSolution(false)
      setSelectedSquare(null)
      setValidMoves([])
      setShowCelebration(false)
    }
  }

  const handlePrevious = () => {
    if (currentPuzzleIndex > 0) {
      const prevIndex = currentPuzzleIndex - 1
      setCurrentPuzzleIndex(prevIndex)
      setBoardState(CHECKMATE_PUZZLES[prevIndex].board)
      setShowSolution(false)
      setSelectedSquare(null)
      setValidMoves([])
      setShowCelebration(false)
    }
  }

  const handleReset = () => {
    setBoardState(currentPuzzle.board)
    setSelectedSquare(null)
    setValidMoves([])
    setShowCelebration(false)
  }

  const handleSquareClick = (row: number, col: number) => {
    const piece = boardState[row][col]

    if (selectedSquare) {
      // Try to make a move
      if (isValidMove(selectedSquare.row, selectedSquare.col, row, col, boardState)) {
        const newBoard = boardState.map(r => [...r])
        newBoard[row][col] = newBoard[selectedSquare.row][selectedSquare.col]
        newBoard[selectedSquare.row][selectedSquare.col] = null
        setBoardState(newBoard)
      }
      setSelectedSquare(null)
      setValidMoves([])
    } else if (piece) {
      // Select a piece
      setSelectedSquare({ row, col })
      setValidMoves(getValidMoves(row, col, boardState))
    }
  }

  return (
    <div className="learning-mode-container">
      <div className="learning-header">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        <h1>♟️ Learning Mode: Checkmate Patterns</h1>
      </div>

      <div className="learning-content">
        <div className="puzzle-info">
          <div className="puzzle-header">
            <h2>Puzzle {currentPuzzle.id} of {CHECKMATE_PUZZLES.length}</h2>
            <h3>{currentPuzzle.title}</h3>
          </div>
          <p className="puzzle-description">{currentPuzzle.description}</p>

          <div className="puzzle-controls">
            <button
              className="solution-button"
              onClick={() => setShowSolution(!showSolution)}
            >
              {showSolution ? '🔒 Hide Solution' : '💡 Show Solution'}
            </button>
            <button
              className="reset-button"
              onClick={handleReset}
            >
              🔄 Reset Puzzle
            </button>
          </div>

          {showSolution && (
            <div className="solution-box">
              <h4>Solution:</h4>
              <p>{currentPuzzle.solution}</p>
            </div>
          )}

          <div className="navigation-buttons">
            <button
              onClick={handlePrevious}
              disabled={currentPuzzleIndex === 0}
              className="nav-button"
            >
              ← Previous
            </button>
            <span className="puzzle-counter">
              {currentPuzzleIndex + 1} / {CHECKMATE_PUZZLES.length}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPuzzleIndex === CHECKMATE_PUZZLES.length - 1}
              className="nav-button"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="puzzle-board">
          <ChessBoard
            boardState={boardState}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            draggedPiece={null}
            lastMove={null}
            hintSquares={[]}
            onDragStart={() => {}}
            onDragOver={() => {}}
            onDrop={() => {}}
            onDragEnd={() => {}}
          />
          <div className="turn-indicator">
            {currentPuzzle.currentPlayer === 'white' ? '⚪ White to move' : '⚫ Black to move'}
          </div>
        </div>
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-modal">
            <div className="celebration-fireworks">
              <div className="firework"></div>
              <div className="firework"></div>
              <div className="firework"></div>
            </div>
            <div className="celebration-content">
              <div className="celebration-trophy">🏆</div>
              <h2 className="celebration-title">Puzzle Solved!</h2>
              <p className="celebration-message">Excellent work! You found the checkmate!</p>
              <div className="celebration-buttons">
                {currentPuzzleIndex < CHECKMATE_PUZZLES.length - 1 ? (
                  <button className="celebration-btn celebration-next" onClick={handleNext}>
                    Next Puzzle →
                  </button>
                ) : (
                  <Link to="/" className="celebration-btn celebration-home">
                    Return Home
                  </Link>
                )}
                <button className="celebration-btn celebration-retry" onClick={handleReset}>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LearningMode
