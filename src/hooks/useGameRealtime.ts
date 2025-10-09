import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, Move } from '../lib/supabaseClient'

export type RealtimeMovePayload = Pick<Move, 'fen_after' | 'player_id'> &
  Partial<Move> & {
    source: 'database' | 'broadcast'
  }

export function useGameRealtime(
  gameId: string,
  onMove: (move: RealtimeMovePayload) => void
): RealtimeChannel | null {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    let isMounted = true

    const realtimeChannel = supabase.channel(`game:${gameId}`, {
      config: {
        broadcast: { self: false },
      },
    })

    realtimeChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          onMove({
            ...(payload.new as Move),
            source: 'database',
          })
        }
      )
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const broadcastMove = payload as Partial<Move> & {
          fen_after?: string
          player_id?: string
        }

        if (!broadcastMove.fen_after || !broadcastMove.player_id) {
          return
        }

        onMove({
          ...broadcastMove,
          source: 'broadcast',
        } as RealtimeMovePayload)
      })

    realtimeChannel.subscribe((status) => {
      if (!isMounted) {
        return
      }
      if (status === 'SUBSCRIBED') {
        setChannel(realtimeChannel)
      }
    })

    return () => {
      isMounted = false
      setChannel(null)
      supabase.removeChannel(realtimeChannel)
    }
  }, [gameId, onMove])

  return channel
}
