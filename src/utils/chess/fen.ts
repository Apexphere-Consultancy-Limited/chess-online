import {
  BoardState,
  PieceSymbol,
  PieceColor,
  HasMoved,
  Position,
  Move,
} from '../../types/chess'
import { getPieceInfo } from './gameBoard'

const PIECE_TO_FEN: Record<PieceSymbol, string> = {
  '♔': 'K',
  '♕': 'Q',
  '♖': 'R',
  '♗': 'B',
  '♘': 'N',
  '♙': 'P',
  '♚': 'k',
  '♛': 'q',
  '♜': 'r',
  '♝': 'b',
  '♞': 'n',
  '♟': 'p',
}

function rowToFen(row: (PieceSymbol | null)[]): string {
  let fenRow = ''
  let emptyCount = 0

  for (const square of row) {
    if (!square) {
      emptyCount += 1
      continue
    }

    if (emptyCount > 0) {
      fenRow += emptyCount.toString()
      emptyCount = 0
    }

    fenRow += PIECE_TO_FEN[square]
  }

  if (emptyCount > 0) {
    fenRow += emptyCount.toString()
  }

  return fenRow
}

function getCastlingRights(boardState: BoardState, hasMoved: HasMoved): string {
  const rights: string[] = []

  // White castling rights
  if (!hasMoved.white.king) {
    if (!hasMoved.white.rookRight && boardState[7][7] === '♖') {
      rights.push('K')
    }
    if (!hasMoved.white.rookLeft && boardState[7][0] === '♖') {
      rights.push('Q')
    }
  }

  // Black castling rights
  if (!hasMoved.black.king) {
    if (!hasMoved.black.rookRight && boardState[0][7] === '♜') {
      rights.push('k')
    }
    if (!hasMoved.black.rookLeft && boardState[0][0] === '♜') {
      rights.push('q')
    }
  }

  return rights.length > 0 ? rights.join('') : '-'
}

function positionToAlgebraic(position: Position | null): string {
  if (!position) {
    return '-'
  }

  const file = String.fromCharCode('a'.charCodeAt(0) + position.col)
  const rank = (8 - position.row).toString()
  return `${file}${rank}`
}

function calculateHalfmoveClock(moveHistory: Move[]): number {
  let clock = 0

  for (let index = moveHistory.length - 1; index >= 0; index -= 1) {
    const move = moveHistory[index]
    const pieceInfo = getPieceInfo(move.piece)
    if (!pieceInfo) {
      break
    }

    const isPawnMove = pieceInfo.type === 'pawn'
    const isCapture = Boolean(move.captured)

    if (isPawnMove || isCapture) {
      break
    }

    clock += 1
  }

  return clock
}

interface FenOptions {
  currentPlayer: PieceColor
  hasMoved: HasMoved
  enPassantTarget: Position | null
  moveHistory: Move[]
}

export function boardStateToFen(boardState: BoardState, options: FenOptions): string {
  const { currentPlayer, hasMoved, enPassantTarget, moveHistory } = options

  const boardRows = boardState.map((row) => rowToFen(row))
  const boardFen = boardRows.join('/')
  const activeColor = currentPlayer === 'white' ? 'w' : 'b'
  const castling = getCastlingRights(boardState, hasMoved)
  const enPassant = positionToAlgebraic(enPassantTarget)
  const halfmoveClock = calculateHalfmoveClock(moveHistory)
  const fullmoveNumber = Math.floor(moveHistory.length / 2) + 1

  return `${boardFen} ${activeColor} ${castling} ${enPassant} ${halfmoveClock} ${fullmoveNumber}`
}
