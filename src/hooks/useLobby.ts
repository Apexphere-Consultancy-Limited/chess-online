import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import type {
  Lobby,
  LobbyChallenge,
  LobbySession,
  LobbySessionStatus,
} from '../types/lobby'
import { callEdgeFunction } from '../utils/edgeFunctions'

const HEARTBEAT_INTERVAL_MS = 20000

type UpsertSessionResponse = {
  success: boolean
  session: LobbySession & { lobby?: Lobby }
}

type CreateChallengeResponse = {
  success: boolean
  challenge: LobbyChallenge & { lobby?: Lobby }
}

type RespondToChallengeResponse = {
  success: boolean
  status: 'accepted' | 'declined'
  game?: { id: string }
}

type CancelChallengeResponse = {
  success: boolean
  status: 'cancelled'
}

interface UseLobbyOptions {
  onChallengeChange?: (payload: RealtimePostgresChangesPayload<LobbyChallenge>) => void
}

interface UseLobbyResult {
  loading: boolean
  error: string | null
  lobbies: Lobby[]
  currentLobby: Lobby | null
  sessions: Array<LobbySession & { profileUsername?: string; profileRating?: number | null }>
  challenges: LobbyChallenge[]
  status: LobbySessionStatus
  switchLobby: (slug: string) => Promise<void>
  setStatus: (status: LobbySessionStatus) => Promise<void>
  createChallenge: (input: { challengedId?: string; challengedUsername?: string; message?: string }) => Promise<void>
  respondToChallenge: (input: { challengeId: string; action: 'accept' | 'decline' }) => Promise<RespondToChallengeResponse | null>
  cancelChallenge: (challengeId: string) => Promise<void>
  leaveLobby: (keepalive?: boolean) => Promise<void>
}

async function fetchProfiles(profileIds: string[]) {
  if (profileIds.length === 0) return new Map<string, { username?: string; elo_rating?: number | null }>()
  const uniqueIds = Array.from(new Set(profileIds))
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, elo_rating')
    .in('id', uniqueIds)
  if (error) {
    throw error
  }
  const map = new Map<string, { username?: string; elo_rating?: number | null }>()
  data?.forEach((profile) => {
    map.set(profile.id, { username: profile.username ?? undefined, elo_rating: profile.elo_rating ?? null })
  })
  return map
}

export function useLobby(options?: UseLobbyOptions): UseLobbyResult {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const isMountedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lobbies, setLobbies] = useState<Lobby[]>([])
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null)
  const [status, setStatusState] = useState<LobbySessionStatus>('available')
  const [sessions, setSessions] = useState<Array<LobbySession & { profileUsername?: string; profileRating?: number | null }>>(
    [],
  )
  const [challenges, setChallenges] = useState<LobbyChallenge[]>([])

  const lobbyChannelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatRef = useRef<number | null>(null)
  const initializedRef = useRef(false)
  const challengeChangeRef = useRef<UseLobbyOptions['onChallengeChange']>(options?.onChallengeChange)
  const challengesRefreshingRef = useRef(false)
  const challengesRefreshPendingRef = useRef(false)
  const lastChallengeUpdateRef = useRef<{ id: string; timestamp: number } | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    challengeChangeRef.current = options?.onChallengeChange
    return () => {
      challengeChangeRef.current = undefined
    }
  }, [options?.onChallengeChange])

  const setStatus = useCallback(
    async (nextStatus: LobbySessionStatus) => {
      if (!currentLobby) return
      try {
        await callEdgeFunction<UpsertSessionResponse>('upsert-lobby-session', {
          status: nextStatus,
          lobbySlug: currentLobby.slug,
        })
        setStatusState(nextStatus)
      } catch (err) {
        console.error('Failed to update lobby status', err)
        setError(err instanceof Error ? err.message : 'Failed to update status')
      }
    },
    [currentLobby],
  )

  const refreshSessions = useCallback(
    async (lobbyId: string) => {
      const { data, error: sessionsError } = await supabase
        .from('lobby_sessions')
        .select('id, lobby_id, player_id, status, last_seen, created_at')
        .eq('lobby_id', lobbyId)
        .order('last_seen', { ascending: false })
      if (sessionsError) {
        throw sessionsError
      }
      const profileIds = data?.map((session) => session.player_id) ?? []
      const profileMap = await fetchProfiles(profileIds)
      const enhanced = (data ?? []).map((session) => ({
        ...session,
        profileUsername: profileMap.get(session.player_id)?.username,
        profileRating: profileMap.get(session.player_id)?.elo_rating ?? null,
      }))
      setSessions(enhanced)
    },
    [],
  )

  const refreshChallenges = useCallback(async () => {
    if (!userId) {
      setChallenges([])
      return
    }
    if (challengesRefreshingRef.current) {
      challengesRefreshPendingRef.current = true
      return
    }
    challengesRefreshingRef.current = true
    try {
      const { data, error: challengesError } = await supabase
        .from('challenges')
        .select('id, lobby_id, challenger_id, challenged_id, status, message, expires_at, created_at, updated_at')
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .order('created_at', { ascending: false })
      if (challengesError) {
        throw challengesError
      }

      const lobbyIds = Array.from(new Set((data ?? []).map((challenge) => challenge.lobby_id).filter(Boolean))) as string[]
      const profileIds = Array.from(
        new Set(
          (data ?? [])
            .flatMap((challenge) => [challenge.challenger_id, challenge.challenged_id])
            .filter(Boolean),
        ),
      )

      const [lobbiesData, profileMap] = await Promise.all([
        lobbyIds.length
          ? supabase
              .from('lobbies')
              .select('*')
              .in('id', lobbyIds)
              .then(({ data: records }) => records ?? [])
          : Promise.resolve([]),
        fetchProfiles(profileIds),
      ])

      const lobbyMap = new Map<string, Lobby>()
      lobbiesData.forEach((lobby) => {
        lobbyMap.set(lobby.id, lobby as Lobby)
      })

      const enhanced = (data ?? []).map((challenge) => ({
        ...challenge,
        lobby: lobbyMap.get(challenge.lobby_id ?? '') ?? undefined,
        challenger_profile: profileMap.get(challenge.challenger_id ?? ''),
        challenged_profile: profileMap.get(challenge.challenged_id ?? ''),
      }))

      setChallenges(enhanced as LobbyChallenge[])
    } finally {
      challengesRefreshingRef.current = false
      if (challengesRefreshPendingRef.current) {
        challengesRefreshPendingRef.current = false
        void refreshChallenges()
      }
    }
  }, [userId])

  const handleChallengeRealtime = useCallback(
    async (payload: RealtimePostgresChangesPayload<LobbyChallenge>) => {
      const challenge = (payload.new ?? payload.old) as LobbyChallenge | undefined
      if (!challenge || !userId) {
        return
      }
      const involvesUser = challenge.challenger_id === userId || challenge.challenged_id === userId
      if (!involvesUser) {
        return
      }

      // Deduplicate rapid-fire events for the same challenge
      const now = Date.now()
      const last = lastChallengeUpdateRef.current
      if (last && last.id === challenge.id && now - last.timestamp < 500) {
        return
      }
      lastChallengeUpdateRef.current = { id: challenge.id, timestamp: now }

      try {
        await refreshChallenges()
        challengeChangeRef.current?.(payload)
      } catch (err) {
        console.error('Failed to refresh challenges via realtime', err)
      }
    },
    [refreshChallenges, userId],
  )

  const leaveLobby = useCallback(
    async (keepalive = false) => {
      try {
        await callEdgeFunction<UpsertSessionResponse>(
          'upsert-lobby-session',
          { intent: 'leave' },
          { keepalive },
        )
      } catch (err) {
        if (!keepalive) {
          console.error('Failed to leave lobby', err)
        }
      }
    },
    [],
  )

  const startHeartbeat = useCallback(
    (lobbySlug: string) => {
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current)
      }
      const tick = async () => {
        try {
          await callEdgeFunction<UpsertSessionResponse>('upsert-lobby-session', {
            status,
            lobbySlug,
          })
        } catch (err) {
          console.error('Heartbeat failed', err)
        }
      }
      // kick off immediately
      void tick()
      heartbeatRef.current = window.setInterval(() => {
        void tick()
      }, HEARTBEAT_INTERVAL_MS)
    },
    [status],
  )

  const subscribeToLobby = useCallback(
    (lobbyId: string) => {
      if (lobbyChannelRef.current) {
        const existing = lobbyChannelRef.current
        lobbyChannelRef.current = null
        void supabase.removeChannel(existing)
      }

      const channel = supabase.channel(`lobby:${lobbyId}`, {
        config: {
          broadcast: { self: false },
        },
      })

      // Listen to lobby sessions changes
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby_sessions', filter: `lobby_id=eq.${lobbyId}` },
        async () => {
          try {
            await refreshSessions(lobbyId)
          } catch (err) {
            console.error('Failed to refresh sessions via realtime', err)
          }
        },
      )

      // Listen to all challenge changes involving current user
      // This covers both challenges in this lobby and challenges where user is challenged
      if (userId) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'challenges', filter: `challenger_id=eq.${userId}` },
          handleChallengeRealtime,
        )
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'challenges', filter: `challenged_id=eq.${userId}` },
          handleChallengeRealtime,
        )
      }

      // Broadcast events for instant challenge notifications
      channel.on('broadcast', { event: 'challenge' }, ({ payload }) => {
        if (userId && payload.challenged_id === userId) {
          void refreshChallenges()
        }
      })

      channel.on('broadcast', { event: 'challenge_cancelled' }, ({ payload }) => {
        if (userId && payload.challenged_id === userId) {
          void refreshChallenges()
        }
      })

      channel.on('broadcast', { event: 'challenge_response' }, ({ payload }) => {
        if (userId && payload.challenger_id === userId) {
          void refreshChallenges()
        }
      })

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Lobby realtime channel error')
        }
        if (status === 'CLOSED') {
          if (lobbyChannelRef.current === channel) {
            console.warn('Lobby realtime channel closed unexpectedly, attempting to resubscribe')
            lobbyChannelRef.current = null
            window.setTimeout(() => {
              if (isMountedRef.current) {
                subscribeToLobby(lobbyId)
              }
            }, 50)
          }
        }
      })

      lobbyChannelRef.current = channel
    },
    [handleChallengeRealtime, refreshChallenges, refreshSessions, userId],
  )


  const initialize = useCallback(async () => {
    if (!userId || initializedRef.current) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: lobbyRecords, error: lobbyError } = await supabase
        .from('lobbies')
        .select('*')
        .order('min_elo', { ascending: true })
      if (lobbyError) {
        throw lobbyError
      }
      setLobbies((lobbyRecords ?? []) as Lobby[])

      const { data: existingSessions, error: sessionError } = await supabase
        .from('lobby_sessions')
        .select('id, lobby_id, player_id, status, last_seen, created_at')
        .eq('player_id', userId)
        .order('last_seen', { ascending: false })
        .limit(1)

      if (sessionError) {
        throw sessionError
      }

      let lobby: Lobby | null = null
      let nextStatus: LobbySessionStatus = 'available'

      if (existingSessions && existingSessions.length > 0) {
        const existing = existingSessions[0]
        const { data: lobbyRecord, error: lobbyFetchError } = await supabase
          .from('lobbies')
          .select('*')
          .eq('id', existing.lobby_id)
          .maybeSingle()
        if (lobbyFetchError) {
          throw lobbyFetchError
        }
        lobby = (lobbyRecord ?? null) as Lobby | null
        nextStatus = existing.status as LobbySessionStatus
      } else {
        const response = await callEdgeFunction<UpsertSessionResponse>('upsert-lobby-session', {
          status: 'available',
        })
        const session = response.session
        nextStatus = session.status as LobbySessionStatus
        if (session.lobby) {
          lobby = session.lobby as Lobby
        } else if (session.lobby_id) {
          const { data: lobbyRecord } = await supabase
            .from('lobbies')
            .select('*')
            .eq('id', session.lobby_id)
            .maybeSingle()
          lobby = (lobbyRecord ?? null) as Lobby | null
        }
      }

      if (lobby) {
        setCurrentLobby(lobby)
        setStatusState(nextStatus)
        await Promise.all([refreshSessions(lobby.id), refreshChallenges()])
        subscribeToLobby(lobby.id)
        startHeartbeat(lobby.slug)
      }
      initializedRef.current = true
    } catch (err) {
      console.error('Failed to initialize lobby', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize lobby')
    } finally {
      setLoading(false)
    }
  }, [refreshChallenges, refreshSessions, startHeartbeat, subscribeToLobby, userId])

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    const handleBeforeUnload = () => {
      void leaveLobby(true)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [leaveLobby])

  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      void leaveLobby(false)
      if (lobbyChannelRef.current) {
        const channel = lobbyChannelRef.current
        lobbyChannelRef.current = null
        void supabase.removeChannel(channel)
      }
    }
  }, [leaveLobby])

  const switchLobby = useCallback(
    async (slug: string) => {
      if (!userId) return
      if (!slug || (currentLobby && slug === currentLobby.slug)) return
      setError(null)
      try {
        const response = await callEdgeFunction<UpsertSessionResponse>('upsert-lobby-session', {
          status,
          lobbySlug: slug,
        })
        const session = response.session
        let lobby = session.lobby as Lobby | undefined
        if (!lobby && session.lobby_id) {
          const { data: lobbyRecord } = await supabase.from('lobbies').select('*').eq('id', session.lobby_id).maybeSingle()
          lobby = lobbyRecord as Lobby | undefined
        }
        if (lobby) {
          setCurrentLobby(lobby)
          await Promise.all([refreshSessions(lobby.id), refreshChallenges()])
          subscribeToLobby(lobby.id)
          startHeartbeat(lobby.slug)
        }
      } catch (err) {
        console.error('Failed to switch lobby', err)
        setError(err instanceof Error ? err.message : 'Failed to switch lobby')
      }
    },
    [currentLobby, refreshChallenges, refreshSessions, startHeartbeat, status, subscribeToLobby, userId],
  )

  const createChallenge = useCallback(
    async (input: { challengedId?: string; challengedUsername?: string; message?: string }) => {
      setError(null)
      try {
        const response = await callEdgeFunction<CreateChallengeResponse>('create-challenge', {
          challengedId: input.challengedId,
          challengedUsername: input.challengedUsername,
          message: input.message,
        })
        await refreshChallenges()

        // Broadcast challenge to lobby channel for instant notification
        if (currentLobby && lobbyChannelRef.current && response.challenge) {
          await lobbyChannelRef.current.send({
            type: 'broadcast',
            event: 'challenge',
            payload: {
              challenged_id: response.challenge.challenged_id,
              challenger_id: response.challenge.challenger_id,
              challenge_id: response.challenge.id,
            },
          })
        }
      } catch (err) {
        console.error('Failed to create challenge', err)
        setError(err instanceof Error ? err.message : 'Failed to create challenge')
        throw err
      }
    },
    [currentLobby, refreshChallenges],
  )

  const cancelChallenge = useCallback(
    async (challengeId: string) => {
      setError(null)
      try {
        // Find the challenge before cancelling to get challenged_id for broadcast
        const challenge = challenges.find(c => c.id === challengeId)

        await callEdgeFunction<CancelChallengeResponse>('cancel-challenge', { challengeId })
        await refreshChallenges()

        // Broadcast cancellation for instant notification to the challenged player
        if (currentLobby && lobbyChannelRef.current && challenge) {
          await lobbyChannelRef.current.send({
            type: 'broadcast',
            event: 'challenge_cancelled',
            payload: {
              challenged_id: challenge.challenged_id,
              challenger_id: challenge.challenger_id,
              challenge_id: challengeId,
            },
          })
        }
      } catch (err) {
        console.error('Failed to cancel challenge', err)
        setError(err instanceof Error ? err.message : 'Failed to cancel challenge')
        throw err
      }
    },
    [challenges, currentLobby, refreshChallenges],
  )

  const respondToChallenge = useCallback(
    async (input: { challengeId: string; action: 'accept' | 'decline' }) => {
      setError(null)
      try {
        // Find the challenge before responding to get challenger_id for broadcast
        const challenge = challenges.find(c => c.id === input.challengeId)

        const response = await callEdgeFunction<RespondToChallengeResponse>('respond-to-challenge', {
          challengeId: input.challengeId,
          action: input.action,
        })
        await refreshChallenges()
        if (currentLobby) {
          await refreshSessions(currentLobby.id)
        }
        if (response.status === 'accepted') {
          setStatusState('in_game')
        }

        // Broadcast response for instant notification to the challenger
        if (currentLobby && lobbyChannelRef.current && challenge) {
          await lobbyChannelRef.current.send({
            type: 'broadcast',
            event: 'challenge_response',
            payload: {
              challenger_id: challenge.challenger_id,
              challenged_id: challenge.challenged_id,
              challenge_id: input.challengeId,
              action: input.action,
            },
          })
        }

        return response
      } catch (err) {
        console.error('Failed to respond to challenge', err)
        setError(err instanceof Error ? err.message : 'Failed to respond to challenge')
        throw err
      }
    },
    [challenges, currentLobby, refreshChallenges, refreshSessions],
  )

  const value = useMemo<UseLobbyResult>(
    () => ({
      loading,
      error,
      lobbies,
      currentLobby,
      sessions,
      challenges,
      status,
      switchLobby,
      setStatus,
      createChallenge,
      respondToChallenge,
      cancelChallenge,
      leaveLobby,
    }),
    [
      challenges,
      currentLobby,
      error,
      leaveLobby,
      loading,
      lobbies,
      respondToChallenge,
      sessions,
      setStatus,
      status,
      switchLobby,
      createChallenge,
      cancelChallenge,
    ],
  )

  return value
}
