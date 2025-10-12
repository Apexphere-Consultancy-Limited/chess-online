/**
 * GameOpponent Interface
 *
 * Abstraction layer that allows the unified chess game to work with
 * different opponent types (online human, local bot, local friend)
 * without knowing the implementation details.
 */

/**
 * Represents a chess move in the game
 */
export interface ChessMove {
  from: string          // e.g., "e2"
  to: string            // e.g., "e4"
  promotion?: string    // e.g., "q" for queen promotion
  fen?: string          // FEN string after the move
  playerId?: string     // ID of the player making the move
  moveNumber?: number   // Move number in the game
}

/**
 * Represents the result of a completed game
 */
export interface GameResult {
  winner: 'white' | 'black' | 'draw'
  reason: 'checkmate' | 'resignation' | 'timeout' | 'stalemate' | 'draw_agreement' | 'insufficient_material' | 'forfeit'
  winnerId?: string
}

/**
 * Configuration for different opponent types
 */
export type OpponentConfig =
  | { type: 'online'; gameId: string }
  | { type: 'bot'; difficulty: 'easy' | 'medium' | 'hard' }
  | { type: 'friend' }

/**
 * Main opponent interface that all opponent implementations must follow
 */
export interface GameOpponent {
  /**
   * Send a move to the opponent
   * For online: sends to server and broadcasts
   * For bot: triggers AI calculation
   * For friend: no-op (local game)
   */
  sendMove: (move: ChessMove) => Promise<void>

  /**
   * Subscribe to opponent moves
   * Returns unsubscribe function
   */
  onOpponentMove: (callback: (move: ChessMove) => void) => () => void

  /**
   * Subscribe to game end events
   * Returns unsubscribe function
   */
  onGameEnd: (callback: (result: GameResult) => void) => () => void

  /**
   * Clean up and disconnect
   */
  disconnect: () => void

  /**
   * Whether this is an online opponent (affects UI - show forfeit, hide undo/hints)
   */
  readonly isOnline: boolean

  /**
   * Opponent type for logging/debugging
   */
  readonly type: OpponentConfig['type']
}
