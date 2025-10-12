import { useEffect, useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import type { GameOpponent } from '../types/gameOpponent'
import { useChessSounds } from '../hooks/useChessSounds'
import ChessBoard from './ChessBoard'
import MoveHistory from './MoveHistory'
import CapturedPieces from './CapturedPieces'
import Timer from './Timer'
import PromotionModal from './PromotionModal'
import GameOverModal from './GameOverModal'
import GameControls from './GameControls'
import BotChat from './BotChat'
import { PIECES, PIECE_VALUES } from '../types/chess'
import type { BoardState, PieceSymbol, PieceType, Move, PieceColor } from '../types/chess'

/**
 * ChessGame Component
 *
 * The single chess game component that works for ALL game modes:
 * - Online multiplayer (vs human over network)
 * - Local vs Bot (easy/medium/hard AI)
 * - Local vs Friend (local multiplayer)
 *
 * Architecture:
 * - Game Component: Owns ALL game logic (rules, board, sounds, UI)
 * - Opponent: ONLY handles communication (sendMove/onOpponentMove)
 */

interface ChessGameProps {
  opponent: GameOpponent
  playerColor?: 'white' | 'black' // For online games, which color am I?
  gameMode?: 'friend' | 'ai-easy' | 'ai-medium' | 'ai-hard' // For offline games
}

const TYPE_MAP: Record<string, PieceType> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

export default function ChessGame({ opponent, playerColor = 'white', gameMode = 'friend' }: ChessGameProps) {
  // Chess.js instance (owns game rules)
  const [chess] = useState(() => new Chess())

  // Sound effects
  const { playMoveSound, playCaptureSound, playCheckSound, playCheckmateSound } = useChessSounds()

  // Board state
  const [boardState, setBoardState] = useState<BoardState>(() =>
    Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null))
  )

  // Game state
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('white')
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null)
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([])
  const [draggedPiece, setDraggedPiece] = useState<{ row: number; col: number } | null>(null)
  const [lastMove, setLastMove] = useState<{ from: { row: number; col: number }; to: { row: number; col: number } } | null>(null)
  const [hintSquares, setHintSquares] = useState<{ row: number; col: number }[]>([])

  // Move history and captures
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [capturedPieces, setCapturedPieces] = useState<{
    white: PieceSymbol[]
    black: PieceSymbol[]
  }>({ white: [], black: [] })
  const [score, setScore] = useState<{ white: number; black: number }>({ white: 0, black: 0 })

  // Modals and game state
  const [promotionData, setPromotionData] = useState<{ row: number; col: number; color: PieceColor } | null>(null)
  const [gameOver, setGameOver] = useState<{ winner: PieceColor | 'draw'; reason: string } | null>(null)

  // Timers
  const [whiteTimeLeft, setWhiteTimeLeft] = useState(600) // 10 minutes
  const [blackTimeLeft, setBlackTimeLeft] = useState(600)
  const [timerActive, setTimerActive] = useState(false)

  // Bot thinking indicator
  const [isComputerThinking, setIsComputerThinking] = useState(false)

  // Initialize board from chess.js
  useEffect(() => {
    updateBoardState()
  }, [])

  // Convert chess.js board to our board state format
  const updateBoardState = useCallback(() => {
    const board = chess.board()
    const newBoardState: BoardState = []

    for (let row = 0; row < 8; row++) {
      const boardRow: (PieceSymbol | null)[] = []
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece) {
          const color = piece.color === 'w' ? 'white' : 'black'
          const type = TYPE_MAP[piece.type]
          if (type) {
            boardRow.push(PIECES[color][type])
          } else {
            boardRow.push(null)
          }
        } else {
          boardRow.push(null)
        }
      }
      newBoardState.push(boardRow)
    }

    setBoardState(newBoardState)
    setCurrentPlayer(chess.turn() === 'w' ? 'white' : 'black')

    // Update move history
    const history = chess.history({ verbose: true })
    const formattedMoves: Move[] = history.map((move) => {
      const piece = PIECES[move.color === 'w' ? 'white' : 'black'][TYPE_MAP[move.piece]]
      const fromCol = move.from.charCodeAt(0) - 97
      const fromRow = 8 - parseInt(move.from[1])
      const toCol = move.to.charCodeAt(0) - 97
      const toRow = 8 - parseInt(move.to[1])

      return {
        piece,
        notation: move.san,
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        timestamp: Date.now(),
        ...(move.captured && { captured: PIECES[move.color === 'w' ? 'black' : 'white'][TYPE_MAP[move.captured]] }),
      }
    })
    setMoveHistory(formattedMoves)

    // Update captured pieces and score
    updateCapturedPieces(board)
  }, [chess])

  // Update captured pieces
  const updateCapturedPieces = useCallback((board: any) => {
    const whiteCaptured: PieceSymbol[] = []
    const blackCaptured: PieceSymbol[] = []

    // Count pieces on board
    const piecesOnBoard = {
      white: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 },
      black: { pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 },
    }

    board.forEach((row: any[]) => {
      row.forEach((piece: any) => {
        if (piece) {
          const color = piece.color === 'w' ? 'white' : 'black'
          const type = TYPE_MAP[piece.type]
          if (type) {
            piecesOnBoard[color][type]++
          }
        }
      })
    })

    // Starting piece counts
    const startingPieces = {
      pawn: 8,
      knight: 2,
      bishop: 2,
      rook: 2,
      queen: 1,
      king: 1,
    }

    // Calculate captured pieces
    Object.entries(startingPieces).forEach(([pieceType, count]) => {
      const type = pieceType as PieceType
      const whiteMissing = count - piecesOnBoard.white[type]
      const blackMissing = count - piecesOnBoard.black[type]

      for (let i = 0; i < whiteMissing; i++) {
        whiteCaptured.push(PIECES.white[type])
      }
      for (let i = 0; i < blackMissing; i++) {
        blackCaptured.push(PIECES.black[type])
      }
    })

    setCapturedPieces({ white: whiteCaptured, black: blackCaptured })

    // Calculate scores
    const whiteScore = whiteCaptured.reduce((sum, piece) => {
      const type = Object.entries(PIECES.white).find(([_, p]) => p === piece)?.[0] as PieceType
      return sum + (type ? PIECE_VALUES[type] : 0)
    }, 0)

    const blackScore = blackCaptured.reduce((sum, piece) => {
      const type = Object.entries(PIECES.black).find(([_, p]) => p === piece)?.[0] as PieceType
      return sum + (type ? PIECE_VALUES[type] : 0)
    }, 0)

    setScore({ white: whiteScore, black: blackScore })
  }, [])

  // TODO: Add more handlers (square click, drag and drop, etc.)
  // TODO: Integrate opponent.sendMove() and opponent.onOpponentMove()
  // TODO: Add conditional UI based on opponent.isOnline

  return (
    <div className="game-container">
      <div className="game-layout">
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
              onSquareClick={() => {}}
              onDragStart={() => {}}
              onDragOver={() => {}}
              onDrop={() => {}}
              onDragEnd={() => {}}
              playerColor={playerColor}
            />
          </div>
        </div>

        {/* Right Side: Timers/Bot Chat and Move History */}
        <div className="right-side-panel">
          {/* Timers or Bot Chat based on game mode */}
          {gameMode === 'friend' || opponent.isOnline ? (
            <div className="timers-container">
              <Timer
                color={opponent.isOnline && playerColor === 'white' ? 'black' : 'black'}
                timeLeft={blackTimeLeft}
                isActive={timerActive && currentPlayer === 'black'}
              />
              <Timer
                color={opponent.isOnline && playerColor === 'white' ? 'white' : 'white'}
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
              inCheck={chess.inCheck()}
              lastMoveCapture={moveHistory.length > 0 && moveHistory[moveHistory.length - 1]?.captured !== undefined}
              isComputerThinking={isComputerThinking}
            />
          )}

          <div className="move-history-panel">
            <MoveHistory moves={moveHistory} />
          </div>

          {/* Game Controls - only for offline games */}
          {!opponent.isOnline && (
            <GameControls
              onUndo={() => {}}
              onHint={() => {}}
              onReset={() => {}}
              canUndo={moveHistory.length > 0}
              gameMode={gameMode}
            />
          )}

          {/* Forfeit button - only for online games */}
          {opponent.isOnline && (
            <div className="online-game-controls">
              <button
                className="control-btn forfeit-btn"
                onClick={() => {}}
                disabled={!!gameOver}
              >
                Forfeit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {promotionData && (
        <PromotionModal
          color={promotionData.color}
          onSelect={() => {}}
        />
      )}

      {gameOver && (
        <GameOverModal
          winner={gameOver.winner}
          reason={gameOver.reason}
          onReset={() => {}}
        />
      )}
    </div>
  )
}
