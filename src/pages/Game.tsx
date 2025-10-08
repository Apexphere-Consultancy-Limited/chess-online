import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import GameModeModal from '../components/GameModeModal'
import PromotionModal from '../components/PromotionModal'
import GameOverModal from '../components/GameOverModal'
import ChessBoard from '../components/ChessBoard'
import CapturedPieces from '../components/CapturedPieces'
import MoveHistory from '../components/MoveHistory'
import GameControls from '../components/GameControls'
import Timer from '../components/Timer'
import BotChat from '../components/BotChat'
import { useMoveRules } from '../hooks/useMoveRules'

function Game() {
  useEffect(() => {
    document.body.classList.add('game-page')
    return () => {
      document.body.classList.remove('game-page')
    }
  }, [])
  const {
    boardState,
    currentPlayer,
    capturedPieces,
    score,
    moveHistory,
    showModal,
    hintsRemaining,
    selectedSquare,
    validMoves,
    draggedPiece,
    promotionData,
    gameOver,
    inCheck,
    isComputerThinking,
    lastMove,
    whiteTimeLeft,
    blackTimeLeft,
    timerActive,
    hintSquares,
    gameMode,
    handleSquareClick,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handlePromotion,
    handleUndo,
    handleHint,
    handleReset,
    setGameMode,
    setShowModal,
  } = useMoveRules()

  return (
    <>
      <Link to="/" className="back-home-link">← Back to Home</Link>

      {showModal && (
        <GameModeModal
          onSelectMode={(mode) => {
            setGameMode(mode)
            setShowModal(false)
          }}
        />
      )}

      {promotionData && (
        <PromotionModal
          color={promotionData.color}
          onSelect={handlePromotion}
        />
      )}

      {gameOver && (
        <GameOverModal
          winner={gameOver.winner}
          reason={gameOver.reason}
          onReset={handleReset}
        />
      )}

      <div className="game-container">
        <div className="game-layout">
          {/* Turn Indicator */}
          <div className={`turn-indicator ${currentPlayer}-turn`} id="turnIndicator">
            {isComputerThinking ? (
              "Computer is thinking..."
            ) : (
              <>
                {inCheck && <span style={{ color: 'red', fontWeight: 'bold' }}>CHECK! </span>}
                {currentPlayer === 'white' ? "White's Turn!" : "Black's Turn!"}
              </>
            )}
          </div>

          {/* Left Side: Captured Pieces */}
          <div className="left-side-panel">
            <CapturedPieces
              color="black"
              capturedPieces={capturedPieces.black}
              score={score.black}
            />
            <CapturedPieces
              color="white"
              capturedPieces={capturedPieces.white}
              score={score.white}
            />
          </div>

          {/* Center: Chess Board */}
          <div className="board-container">
            <div className="board-wrapper">
              <ChessBoard
                boardState={boardState}
                selectedSquare={selectedSquare}
                validMoves={validMoves}
                draggedPiece={draggedPiece}
                lastMove={lastMove}
                hintSquares={hintSquares}
                onSquareClick={handleSquareClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            </div>
          </div>

          {/* Right Side: Timers/Bot Chat and Move History */}
          <div className="right-side-panel">
            {gameMode === 'friend' ? (
              <div className="timers-container">
                <Timer
                  color="black"
                  timeLeft={blackTimeLeft}
                  isActive={timerActive && currentPlayer === 'black'}
                />
                <Timer
                  color="white"
                  timeLeft={whiteTimeLeft}
                  isActive={timerActive && currentPlayer === 'white'}
                />
              </div>
            ) : (
              <BotChat
                moveCount={moveHistory.length}
                lastMove={moveHistory[moveHistory.length - 1] || ''}
                currentPlayer={currentPlayer}
                gameOver={!!gameOver}
                winner={gameOver?.winner || null}
                gameMode={gameMode}
                inCheck={inCheck}
                lastMoveCapture={moveHistory.length > 0 && moveHistory[moveHistory.length - 1]?.captured !== undefined}
                isComputerThinking={isComputerThinking}
              />
            )}
            <div className="move-history-panel">
              <MoveHistory moves={moveHistory} />
            </div>
          </div>

          {/* Bottom Row: Game Controls */}
          <GameControls
            onUndo={handleUndo}
            onHint={handleHint}
            onReset={handleReset}
            canUndo={moveHistory.length > 0}
            gameMode={gameMode}
          />
        </div>
      </div>
    </>
  )
}

export default Game
