import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import LobbyHeader from '../components/lobby/LobbyHeader'
import PlayerList from '../components/lobby/PlayerList'
import ChallengePanel from '../components/lobby/ChallengePanel'
import NotificationDrawer from '../components/lobby/NotificationDrawer'
import ConfirmationModal from '../components/ConfirmationModal'
import { useLobby } from '../hooks/useLobby'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../auth/AuthProvider'
import '../styles/lobby.css'

function Lobby() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    loading,
    error,
    lobbies,
    currentLobby,
    sessions,
    challenges,
    status,
    switchLobby,
    createChallenge,
    respondToChallenge,
    cancelChallenge,
    leaveLobby,
  } = useLobby()

  const [challengeInFlight, setChallengeInFlight] = useState<string | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [confirmChallenge, setConfirmChallenge] = useState<{ playerId: string; playerName: string } | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<{ challengeId: string; playerName: string } | null>(null)
  const [confirmDecline, setConfirmDecline] = useState<{ challengeId: string; playerName: string } | null>(null)

  const { notifications, unreadCount, loading: notificationsLoading, markRead, markAllRead } = useNotifications()

  const currentUserId = user?.id ?? null

  const incomingChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.challenged_id === currentUserId && challenge.status === 'pending'),
    [challenges, currentUserId],
  )

  const pendingChallengesMap = useMemo(() => {
    const map: Record<string, { status: 'pending' | 'unavailable'; challengeId: string }> = {}
    challenges
      .filter((challenge) => challenge.challenger_id === currentUserId && challenge.status === 'pending')
      .forEach((challenge) => {
        if (challenge.challenged_id) {
          map[challenge.challenged_id] = {
            status: 'unavailable',
            challengeId: challenge.id,
          }
        }
      })
    return map
  }, [challenges, currentUserId])

  const combinedError = localError ?? error

  const handleChallengeClick = (playerId: string) => {
    const session = sessions.find((s) => s.player_id === playerId)
    const playerName = session?.profileUsername ?? 'this player'
    setConfirmChallenge({ playerId, playerName })
  }

  const handleChallengeConfirm = async () => {
    if (!confirmChallenge) return
    const { playerId } = confirmChallenge
    setConfirmChallenge(null)
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

  const handleAcceptClick = async (challengeId: string) => {
    setLocalError(null)
    setRespondingTo(challengeId)
    try {
      const response = await respondToChallenge({ challengeId, action: 'accept' })
      if (response?.status === 'accepted' && response.game) {
        await leaveLobby(false)
        navigate(`/game/${response.game.id}`)
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to accept challenge')
    } finally {
      setRespondingTo(null)
    }
  }

  const handleDeclineClick = (challengeId: string) => {
    const challenge = challenges.find((c) => c.id === challengeId)
    const playerName = challenge?.challenger_profile?.username ?? 'this player'
    setConfirmDecline({ challengeId, playerName })
  }

  const handleDeclineConfirm = async () => {
    if (!confirmDecline) return
    const { challengeId } = confirmDecline
    setConfirmDecline(null)
    setLocalError(null)
    setRespondingTo(challengeId)
    try {
      await respondToChallenge({ challengeId, action: 'decline' })
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to decline challenge')
    } finally {
      setRespondingTo(null)
    }
  }

  const handleCancelClick = (challengeId: string) => {
    const challenge = challenges.find((c) => c.id === challengeId)
    const playerName = challenge?.challenged_profile?.username ?? 'this player'
    setConfirmCancel({ challengeId, playerName })
  }

  const handleCancelConfirm = async () => {
    if (!confirmCancel) return
    const { challengeId } = confirmCancel
    setConfirmCancel(null)
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
    <>
      <NavBar />
      <div className="lobby-page">
        <LobbyHeader
          currentLobby={currentLobby}
          lobbies={lobbies}
          status={status}
          onSwitchLobby={(slug) => void switchLobby(slug)}
          onToggleNotifications={() => setNotificationsOpen(true)}
          unreadCount={unreadCount}
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
            onChallenge={handleChallengeClick}
            onCancelChallenge={handleCancelClick}
            challengeInFlight={challengeInFlight}
            pendingChallenges={pendingChallengesMap}
            cancellingId={cancellingId}
          />
        </section>
        <section className="lobby-content__column lobby-content__column--challenges">
          <ChallengePanel
            incoming={incomingChallenges}
            onAccept={(challengeId) => void handleAcceptClick(challengeId)}
            onDecline={handleDeclineClick}
            respondingTo={respondingTo}
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

      {confirmChallenge && (
        <ConfirmationModal
          title="Challenge Player"
          message={`Are you sure you want to challenge ${confirmChallenge.playerName}?`}
          confirmText="Send Challenge"
          cancelText="Cancel"
          onConfirm={handleChallengeConfirm}
          onCancel={() => setConfirmChallenge(null)}
        />
      )}

      {confirmCancel && (
        <ConfirmationModal
          title="Cancel Challenge"
          message={`Are you sure you want to cancel your challenge to ${confirmCancel.playerName}?`}
          confirmText="Cancel Challenge"
          cancelText="Keep Challenge"
          onConfirm={handleCancelConfirm}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {confirmDecline && (
        <ConfirmationModal
          title="Decline Challenge"
          message={`Are you sure you want to decline the challenge from ${confirmDecline.playerName}?`}
          confirmText="Decline Challenge"
          cancelText="Keep Challenge"
          onConfirm={handleDeclineConfirm}
          onCancel={() => setConfirmDecline(null)}
        />
      )}
      </div>
    </>
  )
}

export default Lobby
