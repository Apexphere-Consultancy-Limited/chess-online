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
    console.log('[useSupabaseOpponent] Received move:', payload)

    // For database INSERTs: Process all moves (including our own) for history tracking
    // For broadcasts: Filter out own moves to avoid double-processing
    if (payload.source === 'broadcast' && user && payload.player_id === user.id) {
      console.log('[useSupabaseOpponent] Ignoring own broadcast')
      return
    }

    // For online games, pass along all database metadata
    // This includes san_notation, piece, captured_piece, etc. for move history
    const move: OpponentMove = {
      from: payload.from_square || '',
      to: payload.to_square || '',
      promotion: payload.promotion,
      fen: payload.fen_after, // Include FEN for game state sync

      // Database metadata (for move history tracking)
      source: payload.source,
      player_id: payload.player_id,
      from_square: payload.from_square,
      to_square: payload.to_square,
      piece: payload.piece,
      captured_piece: payload.captured_piece,
      san_notation: payload.san_notation,
      move_number: payload.move_number,
      fen_after: payload.fen_after,
    }

    // Notify all subscribers using ref (doesn't cause re-renders)
    moveCallbacksRef.current.forEach(callback => callback(move))
  }, [user])

  // Subscribe to realtime updates (call hook at top level, not inside useEffect)
  const channel = useGameRealtime(gameId, handleRealtimeMove)

  const opponent: GameOpponent = {
    sendMove: async (move: OpponentMove) => {
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('[useSupabaseOpponent] Sending move:', move)

      // Send to server for validation and storage
      const response = await makeMove(gameId, move.from, move.to, move.promotion)
      console.log('[useSupabaseOpponent] Move validated by server:', response)

      // Broadcast to opponent via realtime (for instant feedback)
      if (channel && channel.state === 'joined') {
        const broadcastPayload = {
          from_square: move.from,
          to_square: move.to,
          promotion: move.promotion,
          fen_after: response.move.fen, // Include FEN from server response
          player_id: user.id,
        }
        console.log('[useSupabaseOpponent] Broadcasting move:', broadcastPayload)
        const result = await channel.send({
          type: 'broadcast',
          event: 'move',
          payload: broadcastPayload,
        })
        console.log('[useSupabaseOpponent] Broadcast result:', result)
      } else {
        console.warn('[useSupabaseOpponent] Channel not joined, state:', channel?.state)
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
