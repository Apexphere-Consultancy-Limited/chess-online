import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { makeMove } from './useMakeMove'
import { useGameRealtime } from './useGameRealtime'
import type { GameOpponent, ChessMove, GameResult } from '../types/gameOpponent'

/**
 * Online opponent implementation using Supabase Realtime
 * Wraps existing online game logic into the GameOpponent interface
 */
export function useSupabaseOpponent(gameId: string): GameOpponent {
  const { user } = useAuth()
  const [moveCallbacks, setMoveCallbacks] = useState<Array<(move: ChessMove) => void>>([])
  const [gameEndCallbacks, setGameEndCallbacks] = useState<Array<(result: GameResult) => void>>([])
  const channelRef = useRef<ReturnType<typeof useGameRealtime>>(null)

  // Handle incoming moves from realtime channel
  const handleRealtimeMove = (payload: any) => {
    const move: ChessMove = {
      from: payload.from_square || '',
      to: payload.to_square || '',
      promotion: payload.promotion,
      fen: payload.fen_after,
      playerId: payload.player_id,
      moveNumber: payload.move_number,
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

  // Monitor game status for completion
  useEffect(() => {
    const subscription = supabase
      .channel(`game-status:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const game = payload.new as any
          if (game.status === 'completed') {
            const result: GameResult = {
              winner: game.winner === 'white' ? 'white' : game.winner === 'black' ? 'black' : 'draw',
              reason: game.termination_type || 'checkmate',
              winnerId: game.winner_id,
            }
            gameEndCallbacks.forEach(callback => callback(result))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [gameId, gameEndCallbacks])

  const opponent: GameOpponent = {
    sendMove: async (move: ChessMove) => {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Call existing makeMove function
      await makeMove(gameId, move.from, move.to, move.promotion)

      // Broadcast move via realtime channel
      if (channelRef.current && channelRef.current.state === 'joined') {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'move',
          payload: {
            fen_after: move.fen,
            player_id: user.id,
            move_number: move.moveNumber,
            from_square: move.from,
            to_square: move.to,
            promotion: move.promotion,
          },
        })
      }
    },

    onOpponentMove: (callback: (move: ChessMove) => void) => {
      setMoveCallbacks(prev => [...prev, callback])

      // Return unsubscribe function
      return () => {
        setMoveCallbacks(prev => prev.filter(cb => cb !== callback))
      }
    },

    onGameEnd: (callback: (result: GameResult) => void) => {
      setGameEndCallbacks(prev => [...prev, callback])

      // Return unsubscribe function
      return () => {
        setGameEndCallbacks(prev => prev.filter(cb => cb !== callback))
      }
    },

    disconnect: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setMoveCallbacks([])
      setGameEndCallbacks([])
    },

    isOnline: true,
    type: 'online' as const,
  }

  return opponent
}
