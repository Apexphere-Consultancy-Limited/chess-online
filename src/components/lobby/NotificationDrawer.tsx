import type { LobbyNotification } from '../../types/lobby'

interface NotificationDrawerProps {
  open: boolean
  notifications: LobbyNotification[]
  loading: boolean
  onClose: () => void
  onMarkRead: (ids: string[]) => Promise<void>
  onMarkAll: () => Promise<void>
  onNavigateToGame?: (gameId: string) => void
  onNavigateToChallenge?: (challengeId: string) => void
}

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate)
  const now = Date.now()
  const diff = Math.floor((now - date.getTime()) / 1000)

  if (diff < 60) return 'Just now'
  if (diff < 3600) {
    const mins = Math.floor(diff / 60)
    return `${mins} min${mins === 1 ? '' : 's'} ago`
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const days = Math.floor(diff / 86400)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function buildMessage(notification: LobbyNotification) {
  const { type, payload } = notification
  const challenger = payload?.challengerUsername ?? 'Opponent'
  const opponent = payload?.opponentUsername ?? 'Opponent'
  switch (type) {
    case 'challenge_received':
      return `${challenger} challenged you${payload?.lobbySlug ? ` in ${payload.lobbySlug}` : ''}.`
    case 'challenge_accepted':
      return `${opponent} accepted your challenge${payload?.lobbySlug ? ` in ${payload.lobbySlug}` : ''}.`
    case 'challenge_declined':
      return `${opponent} declined your challenge.`
    case 'challenge_cancelled':
      return `${challenger} cancelled the challenge${payload?.lobbySlug ? ` in ${payload.lobbySlug}` : ''}.`
    case 'game_ready':
      return `Game is ready${payload?.lobbySlug ? ` in ${payload.lobbySlug}` : ''}.`
    default:
      return 'You have a new notification.'
  }
}

function NotificationDrawer({
  open,
  notifications,
  loading,
  onClose,
  onMarkRead,
  onMarkAll,
  onNavigateToGame,
  onNavigateToChallenge,
}: NotificationDrawerProps) {
  if (!open) return null

  const handleEntryClick = async (notification: LobbyNotification) => {
    if (!notification.read_at) {
      await onMarkRead([notification.id])
    }
    if (notification.type === 'game_ready' && notification.payload?.gameId && onNavigateToGame) {
      onNavigateToGame(notification.payload.gameId)
      return
    }
    if (notification.type === 'challenge_received' && notification.payload?.challengeId && onNavigateToChallenge) {
      onNavigateToChallenge(notification.payload.challengeId)
    }
  }

  const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id)

  return (
    <div className="notification-drawer-overlay" role="dialog" aria-modal="true">
      <div className="notification-drawer">
        <div className="notification-drawer__header">
          <h2>Notifications</h2>
          <div className="notification-drawer__actions">
            <button
              type="button"
              className="notification-drawer__button"
              onClick={() => {
                if (unreadIds.length) {
                  void onMarkRead(unreadIds)
                }
              }}
              disabled={!unreadIds.length}
            >
              Mark unread as read
            </button>
            <button
              type="button"
              className="notification-drawer__button"
              onClick={() => {
                void onMarkAll()
              }}
              disabled={!notifications.length}
            >
              Mark all read
            </button>
            <button type="button" className="notification-drawer__close" onClick={onClose} aria-label="Close notifications">
              ×
            </button>
          </div>
        </div>

        <div className="notification-drawer__content">
          {loading && <div className="notification-drawer__empty">Loading notifications...</div>}
          {!loading && notifications.length === 0 && (
            <div className="notification-drawer__empty">You&apos;re all caught up.</div>
          )}
          {!loading &&
            notifications.map((notification) => {
              const isUnread = !notification.read_at
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleEntryClick(notification)}
                  className={`notification-item ${isUnread ? 'notification-item--unread' : ''}`}
                >
                  <div className="notification-item__message">{buildMessage(notification)}</div>
                  <div className="notification-item__meta">
                    <span>{formatRelativeTime(notification.created_at)}</span>
                    {isUnread && <span className="notification-item__badge">New</span>}
                  </div>
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default NotificationDrawer
