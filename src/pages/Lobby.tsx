import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import LobbyHeader from '../components/lobby/LobbyHeader'
import PlayerList from '../components/lobby/PlayerList'
import ChallengePanel from '../components/lobby/ChallengePanel'
import NotificationDrawer from '../components/lobby/NotificationDrawer'
import { useLobby } from '../hooks/useLobby'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../auth/AuthProvider'
import '../styles/lobby.css'
import type { LobbyChallenge } from '../types/lobby'

function Lobby() {
  const navigate = useNavigate()
  const refreshChallengesRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const { notifications, unreadCount, loading: notificationsLoading, markRead, markAllRead, refresh: refreshNotifications } = useNotifications({
    onInsert: (notification) => {
      if (notification.type === 'challenge_received' || notification.type === 'challenge_cancelled' || notification.type === 'challenge_accepted' || notification.type === 'challenge_declined') {
        void refreshChallengesRef.current()
      }
    },
  })
  const challengeNotificationHandler = useCallback(
    (payload: RealtimePostgresChangesPayload<LobbyChallenge>) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        void refreshNotifications({ silent: true })
        void refreshChallengesRef.current()
      }
    },
    [refreshNotifications],
  )
  const { user } = useAuth()
  const {
    loading,
    error,
    lobbies,
    currentLobby,
    sessions,
    challenges,
    status,
    refreshing,
    switchLobby,
    createChallenge,
    respondToChallenge,
    cancelChallenge,
    leaveLobby,
    refresh,
  } = useLobby({ onChallengeChange: challengeNotificationHandler })

  const [challengeInFlight, setChallengeInFlight] = useState<string | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    refreshChallengesRef.current = refresh
  }, [refresh])

  useEffect(() => {
    refreshChallengesRef.current = refresh
  }, [refresh])

  const currentUserId = user?.id ?? null

  const incomingChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.challenged_id === currentUserId && challenge.status === 'pending'),
    [challenges, currentUserId],
  )

  const outgoingChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.challenger_id === currentUserId),
    [challenges, currentUserId],
  )

  const pendingChallengesMap = useMemo(() => {
    const map: Record<string, 'pending' | 'unavailable'> = {}
    outgoingChallenges
      .filter((challenge) => challenge.status === 'pending')
      .forEach((challenge) => {
        if (challenge.challenged_id) {
          map[challenge.challenged_id] = 'unavailable'
        }
      })
    return map
  }, [outgoingChallenges])

  const combinedError = localError ?? error

  const handleChallenge = async (playerId: string) => {
    setLocalError(null)
    setChallengeInFlight(playerId)
    try {
      await createChallenge({ challengedId: playerId })
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create challenge')
    } finally {
      setChallengeInFlight(null)
    }
  }

  const handleRespond = async (challengeId: string, action: 'accept' | 'decline') => {
    setLocalError(null)
    setRespondingTo(challengeId)
    try {
      const response = await respondToChallenge({ challengeId, action })
      if (response?.status === 'accepted' && response.game) {
        await leaveLobby(false)
        navigate(`/game/${response.game.id}`)
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to update challenge')
    } finally {
      setRespondingTo(null)
    }
  }

  const handleCancel = async (challengeId: string) => {
    setLocalError(null)
    setCancellingId(challengeId)
    try {
      await cancelChallenge(challengeId)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to cancel challenge')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading && !currentLobby) {
    return (
      <div className="lobby-page lobby-page--loading">
        <p>Loading lobby…</p>
      </div>
    )
  }

  return (
    <div className="lobby-page">
      <LobbyHeader
        currentLobby={currentLobby}
        lobbies={lobbies}
        status={status}
        onSwitchLobby={(slug) => void switchLobby(slug)}
        onToggleNotifications={() => setNotificationsOpen(true)}
        unreadCount={unreadCount}
        onRefresh={() => void refresh()}
        refreshing={refreshing}
      />

      {combinedError && (
        <div className="lobby-error" role="alert">
          <p>{combinedError}</p>
          <button type="button" onClick={() => setLocalError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="lobby-content">
        <section className="lobby-content__column lobby-content__column--players">
          <h2>Players Online</h2>
          <PlayerList
            sessions={sessions}
            currentUserId={currentUserId}
            onChallenge={handleChallenge}
            challengeInFlight={challengeInFlight}
            pendingChallenges={pendingChallengesMap}
          />
        </section>
        <section className="lobby-content__column lobby-content__column--challenges">
          <ChallengePanel
            incoming={incomingChallenges}
            outgoing={outgoingChallenges}
            onAccept={(challengeId) => void handleRespond(challengeId, 'accept')}
            onDecline={(challengeId) => void handleRespond(challengeId, 'decline')}
            onCancel={(challengeId) => void handleCancel(challengeId)}
            respondingTo={respondingTo}
            cancellingId={cancellingId}
          />
        </section>
      </div>

      <NotificationDrawer
        open={notificationsOpen}
        notifications={notifications}
        loading={notificationsLoading}
        onClose={() => setNotificationsOpen(false)}
        onMarkRead={(ids) => markRead(ids)}
        onMarkAll={() => markAllRead()}
        onNavigateToGame={(gameId) => {
          setNotificationsOpen(false)
          navigate(`/game/${gameId}`)
        }}
        onNavigateToChallenge={(challengeId) => {
          setNotificationsOpen(false)
          const target = incomingChallenges.find((challenge) => challenge.id === challengeId)
          if (target) {
            // scroll into view if present
            const element = document.getElementById(`challenge-${challengeId}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }}
      />
    </div>
  )
}

export default Lobby
