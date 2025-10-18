import { useCallback, useRef } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { makeMove } from './useMakeMove'
import { useGameRealtime } from './useGameRealtime'
import type { GameOpponent, OpponentMove } from '../types/gameOpponent'

/**
 * Online opponent - communicates via Supabase Realtime
 *
 * Responsibilities:
 * - Send player's move to server and broadcast to opponent
 * - Receive opponent's move from realtime channel
 * - That's it! No game logic, no validation, no board state
 */
export function useSupabaseOpponent(gameId: string): GameOpponent {
  const { user } = useAuth()
  const moveCallbacksRef = useRef<Array<(move: OpponentMove) => void>>([])

  // Handle incoming moves from realtime channel (stable reference using useCallback)
  const handleRealtimeMove = useCallback((payload: any) => {
    // For online games, we get the FEN after the move
    // We need to extract the move from the database payload
    const move: OpponentMove = {
      from: payload.from_square || '',
      to: payload.to_square || '',
      promotion: payload.promotion,
      fen: payload.fen_after, // Include FEN for game state sync
    }

    // Notify all subscribers using ref (doesn't cause re-renders)
    moveCallbacksRef.current.forEach(callback => callback(move))
  }, [])

  // Subscribe to realtime updates (call hook at top level, not inside useEffect)
  const channel = useGameRealtime(gameId, handleRealtimeMove)

  const opponent: GameOpponent = {
    sendMove: async (move: OpponentMove) => {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Send to server for validation and storage
      const response = await makeMove(gameId, move.from, move.to, move.promotion)

      // Broadcast to opponent via realtime (for instant feedback)
      if (channel && channel.state === 'joined') {
        await channel.send({
          type: 'broadcast',
          event: 'move',
          payload: {
            from_square: move.from,
            to_square: move.to,
            promotion: move.promotion,
            fen_after: response.move.fen, // Include FEN from server response
            player_id: user.id,
          },
        })
      }
    },

    onOpponentMove: (callback: (move: OpponentMove) => void) => {
      moveCallbacksRef.current.push(callback)

      // Return unsubscribe function
      return () => {
        moveCallbacksRef.current = moveCallbacksRef.current.filter(cb => cb !== callback)
      }
    },

    disconnect: () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      moveCallbacksRef.current = []
    },

    isOnline: true,
    type: 'online' as const,
  }

  return opponent
}
