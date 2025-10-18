/**
 * GameOpponent Interface
 *
 * FOCUSED ON COMMUNICATION ONLY!
 * Handles ONLY player-to-player communication (sending/receiving moves).
 * Does NOT handle: chess rules, board state, sounds, UI, game logic.
 *
 * Separation of Concerns:
 * - Game Component: Chess rules, board state, sounds, UI, validation
 * - Opponent: Message passing between players (send/receive moves)
 */

/**
 * Simple move data - just algebraic notation
 * The Game owns validation and board state, opponent just passes messages
 */
export interface OpponentMove {
  from: string        // e.g., "e2"
  to: string          // e.g., "e4"
  promotion?: string  // e.g., "q" for queen promotion
  fen?: string        // Optional: FEN string after the move (for bot to calculate response)
}

/**
 * Configuration for different opponent types
 */
export type OpponentConfig =
  | { type: 'online'; gameId: string }
  | { type: 'bot'; difficulty: 'easy' | 'medium' | 'hard' }
  | { type: 'friend' }

/**
 * Main opponent interface - COMMUNICATION ONLY
 *
 * Think of it as a message bus:
 * - sendMove() = "Tell opponent I moved"
 * - onOpponentMove() = "Listen for opponent's move"
 */
export interface GameOpponent {
  /**
   * Send my move to the opponent
   *
   * - Online: Sends to server + broadcasts via realtime
   * - Bot: Triggers AI to calculate response
   * - Friend: No-op (both players are local)
   *
   * Game has already validated and applied the move.
   * Opponent just notifies the other player.
   */
  sendMove: (move: OpponentMove) => Promise<void>

  /**
   * Subscribe to opponent's moves
   *
   * When opponent makes a move, callback receives move data.
   * Game will validate and apply the move to the board.
   *
   * Returns unsubscribe function.
   */
  onOpponentMove: (callback: (move: OpponentMove) => void) => () => void

  /**
   * Clean up and disconnect
   */
  disconnect: () => void

  /**
   * Whether this is an online opponent
   *
   * UI uses this to decide which controls to show:
   * - Online: Show "Forfeit", hide "Undo/Hints"
   * - Offline: Show "Undo/Hints", hide "Forfeit"
   */
  readonly isOnline: boolean

  /**
   * Opponent type for logging/debugging
   */
  readonly type: OpponentConfig['type']

  /**
   * Whether it's the opponent's turn (they are "thinking")
   *
   * Universal concept across all opponent types:
   * - Bot: true during their turn (includes artificial delay + calculation)
   * - Online: true when waiting for their move
   * - Friend: true when it's their turn (black player thinking)
   *
   * Philosophy: All players "think" on their turn. Bots just add artificial
   * delay to simulate human reaction time.
   */
  readonly isThinking?: boolean
}
