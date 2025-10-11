import { getBotAnimationUrl } from '../lib/storage'

export const BOT_ANIMATIONS = {
  easy: {
    idle: getBotAnimationUrl('easy', 'idle-1'),
    idle2: getBotAnimationUrl('easy', 'idle-2'),
    thinking: getBotAnimationUrl('easy', 'thinking'),
    capturePiece: getBotAnimationUrl('easy', 'capture-piece'),
    lostPiece: getBotAnimationUrl('easy', 'lost-piece'),
    celebrate: getBotAnimationUrl('easy', 'celebrate'),
    scared: getBotAnimationUrl('easy', 'scared'),
    check: getBotAnimationUrl('easy', 'check'),
  },
  medium: {
    idle: getBotAnimationUrl('medium', 'idle'),
    thinking: getBotAnimationUrl('medium', 'thinking'),
    capturePiece: getBotAnimationUrl('medium', 'capture-piece'),
    lostPiece: getBotAnimationUrl('medium', 'lost-piece'),
    check: getBotAnimationUrl('medium', 'check'),
    scared: getBotAnimationUrl('medium', 'scared'),
    win: getBotAnimationUrl('medium', 'win'),
    lostGame: getBotAnimationUrl('medium', 'lost-game'),
  },
  hard: {
    idle: getBotAnimationUrl('hard', 'idle-1'),
    thinking: getBotAnimationUrl('hard', 'thinking'),
    capturePiece: getBotAnimationUrl('hard', 'capture-piece'),
    lostPiece: getBotAnimationUrl('hard', 'lost-piece'),
    celebrate: getBotAnimationUrl('hard', 'celebrate'),
    check: getBotAnimationUrl('hard', 'check'),
  },
} as const
