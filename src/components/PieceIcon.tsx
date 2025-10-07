import { PieceSymbol } from '../types/chess'

type PieceKey =
  | 'wp' | 'wn' | 'wb' | 'wr' | 'wq' | 'wk'
  | 'bp' | 'bn' | 'bb' | 'br' | 'bq' | 'bk'

const UNICODE_TO_KEY: Record<PieceSymbol, PieceKey> = {
  '♙': 'wp',
  '♘': 'wn',
  '♗': 'wb',
  '♖': 'wr',
  '♕': 'wq',
  '♔': 'wk',
  '♟': 'bp',
  '♞': 'bn',
  '♝': 'bb',
  '♜': 'br',
  '♛': 'bq',
  '♚': 'bk',
}

const PIECE_LABELS: Record<PieceKey, string> = {
  wp: 'White Pawn',
  wn: 'White Knight',
  wb: 'White Bishop',
  wr: 'White Rook',
  wq: 'White Queen',
  wk: 'White King',
  bp: 'Black Pawn',
  bn: 'Black Knight',
  bb: 'Black Bishop',
  br: 'Black Rook',
  bq: 'Black Queen',
  bk: 'Black King',
}

const PIECE_SOURCES: Record<PieceKey, string> = {
  wp: '/assets/pieces/wp.png',
  wn: '/assets/pieces/wn.png',
  wb: '/assets/pieces/wb.png',
  wr: '/assets/pieces/wr.png',
  wq: '/assets/pieces/wq.png',
  wk: '/assets/pieces/wk.png',
  bp: '/assets/pieces/bp.png',
  bn: '/assets/pieces/bn.png',
  bb: '/assets/pieces/bb.png',
  br: '/assets/pieces/br.png',
  bq: '/assets/pieces/bq.png',
  bk: '/assets/pieces/bk.png',
}

function normalisePieceKey(input: PieceSymbol | string | null | undefined): PieceKey | null {
  if (!input) {
    return null
  }

  if (typeof input === 'string') {
    if (UNICODE_TO_KEY[input as PieceSymbol]) {
      return UNICODE_TO_KEY[input as PieceSymbol]
    }

    const lower = input.toLowerCase()
    if (lower.length === 2 && (lower[0] === 'w' || lower[0] === 'b')) {
      const type = lower[1]
      if ('pnbrqk'.includes(type)) {
        return lower as PieceKey
      }
    }
  }

  return null
}

export function PieceIcon({ piece }: { piece: PieceSymbol | string }) {
  const key = normalisePieceKey(piece)

  if (!key) {
    return <span>{piece}</span>
  }

  const src = PIECE_SOURCES[key]
  const label = PIECE_LABELS[key]

  return (
    <img
      src={src}
      alt={label}
      className="piece-image"
      draggable={false}
      loading="lazy"
    />
  )
}
