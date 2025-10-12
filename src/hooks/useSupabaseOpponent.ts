import { useEffect, useRef, useState } from 'react'
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
  const [moveCallbacks, setMoveCallbacks] = useState<Array<(move: OpponentMove) => void>>([])
  const channelRef = useRef<ReturnType<typeof useGameRealtime>>(null)

  // Handle incoming moves from realtime channel
  const handleRealtimeMove = (payload: any) => {
    // Extract just the move data - nothing else!
    const move: OpponentMove = {
      from: payload.from_square || '',
      to: payload.to_square || '',
      promotion: payload.promotion,
    }

    // Notify all subscribers
    moveCallbacks.forEach(callback => callback(move))
  }

  // Subscribe to realtime updates
  useEffect(() => {
    channelRef.current = useGameRealtime(gameId, handleRealtimeMove)

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [gameId])

  const opponent: GameOpponent = {
    sendMove: async (move: OpponentMove) => {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Send to server for validation and storage
      await makeMove(gameId, move.from, move.to, move.promotion)

      // Broadcast to opponent via realtime (for instant feedback)
      if (channelRef.current && channelRef.current.state === 'joined') {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'move',
          payload: {
            from_square: move.from,
            to_square: move.to,
            promotion: move.promotion,
            player_id: user.id,
          },
        })
      }
    },

    onOpponentMove: (callback: (move: OpponentMove) => void) => {
      setMoveCallbacks(prev => [...prev, callback])

      // Return unsubscribe function
      return () => {
        setMoveCallbacks(prev => prev.filter(cb => cb !== callback))
      }
    },

    disconnect: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setMoveCallbacks([])
    },

    isOnline: true,
    type: 'online' as const,
  }

  return opponent
}
