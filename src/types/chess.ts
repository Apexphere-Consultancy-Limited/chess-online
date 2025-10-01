export type PieceColor = 'white' | 'black'
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type PieceSymbol = '♔' | '♕' | '♖' | '♗' | '♘' | '♙' | '♚' | '♛' | '♜' | '♝' | '♞' | '♟'
export type GameMode = 'friend' | 'ai-easy' | 'ai-medium' | 'ai-hard'

export interface Pieces {
  white: Record<PieceType, PieceSymbol>
  black: Record<PieceType, PieceSymbol>
}

export type BoardState = (PieceSymbol | null)[][]

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  piece: PieceSymbol
  captured?: PieceSymbol
  notation: string
  timestamp: number
}

export interface CapturedPieces {
  white: PieceSymbol[]
  black: PieceSymbol[]
}

export interface Score {
  white: number
  black: number
}

export interface HasMoved {
  white: {
    king: boolean
    rookLeft: boolean
    rookRight: boolean
  }
  black: {
    king: boolean
    rookLeft: boolean
    rookRight: boolean
  }
}

export interface GameState {
  boardState: BoardState
  currentPlayer: PieceColor
  capturedPieces: CapturedPieces
  score: Score
  moveHistory: Move[]
  gameMode: GameMode
  gameOver: boolean
  hasMoved: HasMoved
  enPassantTarget: Position | null
  hintsRemaining: number
}

export interface PromotionData {
  row: number
  col: number
  color: PieceColor
}

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
}

export const PIECES: Pieces = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
}

export const INITIAL_BOARD: BoardState = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
]
