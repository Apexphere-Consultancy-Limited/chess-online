import {
  BoardState,
  HasMoved,
  Move,
  PieceColor,
  PieceType,
  Position,
} from '../../types/chess'
import { boardStateToFen } from '../chess'

interface StockfishSearchOptions {
  depth?: number
  movetime?: number
}

interface StockfishRequest {
  boardState: BoardState
  currentPlayer: PieceColor
  hasMoved: HasMoved
  enPassantTarget: Position | null
  moveHistory: Move[]
  search: StockfishSearchOptions
}

export interface StockfishBestMove {
  from: Position
  to: Position
  promotion?: PieceType
}

const PROMOTION_MAP: Record<string, PieceType> = {
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
}

class StockfishEngine {
  private worker: Worker | null
  private readyResolvers: Array<() => void> = []
  private pendingReadyPromise: Promise<void> | null = null
  private bestMoveResolver: ((move: string | null) => void) | null = null
  private isSearching = false

  constructor() {
    if (typeof Worker === 'undefined') {
      this.worker = null
      return
    }

    this.worker = new Worker('/stockfish.js')
    this.worker.addEventListener('message', this.handleMessage)
    this.worker.postMessage('uci')
  }

  private post(command: string) {
    this.worker?.postMessage(command)
  }

  private handleMessage = (event: MessageEvent<string>) => {
    const message = event.data
    if (typeof message !== 'string') {
      return
    }

    if (message === 'uciok') {
      this.requestReady()
      return
    }

    if (message === 'readyok') {
      const resolvers = [...this.readyResolvers]
      this.readyResolvers = []
      this.pendingReadyPromise = null
      resolvers.forEach((resolve) => resolve())
      return
    }

    if (message.startsWith('bestmove')) {
      const parts = message.split(' ')
      const moveToken = parts[1] && parts[1] !== '(none)' ? parts[1] : null
      const resolver = this.bestMoveResolver
      this.bestMoveResolver = null
      this.isSearching = false
      if (resolver) {
        resolver(moveToken)
      }
      this.requestReady()
    }
  }

  private requestReady() {
    if (!this.worker) return
    if (this.isSearching) return
    this.post('isready')
  }

  private waitUntilReady(): Promise<void> {
    if (!this.worker) {
      return Promise.reject(new Error('Stockfish worker not available'))
    }

    if (!this.pendingReadyPromise) {
      this.pendingReadyPromise = new Promise((resolve) => {
        this.readyResolvers.push(resolve)
      })
      this.requestReady()
    }

    return this.pendingReadyPromise
  }

  async getBestMove(fen: string, search: StockfishSearchOptions): Promise<string | null> {
    if (!this.worker) {
      return null
    }

    await this.waitUntilReady()

    return new Promise((resolve) => {
      this.isSearching = true
      this.bestMoveResolver = (move) => {
        resolve(move)
      }

      this.post('ucinewgame')
      this.post(`position fen ${fen}`)

      const { depth, movetime } = search
      if (typeof movetime === 'number') {
        this.post(`go movetime ${Math.max(1, movetime)}`)
      } else if (typeof depth === 'number') {
        this.post(`go depth ${Math.max(1, depth)}`)
      } else {
        this.post('go depth 8')
      }
    })
  }

  stop() {
    if (!this.worker || !this.isSearching) {
      if (this.bestMoveResolver) {
        this.bestMoveResolver(null)
        this.bestMoveResolver = null
      }
      return
    }
    this.post('stop')
    this.isSearching = false
    if (this.bestMoveResolver) {
      this.bestMoveResolver(null)
      this.bestMoveResolver = null
    }
  }

  terminate() {
    this.worker?.terminate()
    this.worker = null
    this.readyResolvers = []
    this.pendingReadyPromise = null
    this.bestMoveResolver = null
    this.isSearching = false
  }
}

let engine: StockfishEngine | null = null

function getEngine(): StockfishEngine | null {
  if (typeof Worker === 'undefined') {
    return null
  }

  if (!engine) {
    engine = new StockfishEngine()
  }

  return engine
}

function algebraicToPosition(square: string): Position | null {
  if (square.length < 2) {
    return null
  }

  const fileChar = square[0]
  const rankChar = square[1]
  const col = fileChar.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = parseInt(rankChar, 10)

  if (Number.isNaN(rank) || col < 0 || col > 7) {
    return null
  }

  const row = 8 - rank
  if (row < 0 || row > 7) {
    return null
  }

  return { row, col }
}

function parseBestMove(bestMove: string | null): StockfishBestMove | null {
  if (!bestMove || bestMove.length < 4) {
    return null
  }

  const fromSquare = bestMove.slice(0, 2)
  const toSquare = bestMove.slice(2, 4)
  const promotionChar = bestMove.length >= 5 ? bestMove[4] : undefined

  const from = algebraicToPosition(fromSquare)
  const to = algebraicToPosition(toSquare)

  if (!from || !to) {
    return null
  }

  const promotion = promotionChar ? PROMOTION_MAP[promotionChar.toLowerCase()] : undefined

  return { from, to, promotion }
}

export async function getStockfishBestMove(request: StockfishRequest): Promise<StockfishBestMove | null> {
  const engineInstance = getEngine()
  if (!engineInstance) {
    return null
  }

  const fen = boardStateToFen(request.boardState, {
    currentPlayer: request.currentPlayer,
    hasMoved: request.hasMoved,
    enPassantTarget: request.enPassantTarget,
    moveHistory: request.moveHistory,
  })

  const bestmove = await engineInstance.getBestMove(fen, request.search)
  return parseBestMove(bestmove)
}

export function stopStockfishSearch() {
  engine?.stop()
}

export function disposeStockfish() {
  engine?.terminate()
  engine = null
}
