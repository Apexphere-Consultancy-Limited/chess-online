import type { Lobby, LobbySessionStatus } from '../../types/lobby'
import NotificationBell from './NotificationBell'
import LobbyTabs from './LobbyTabs'

interface LobbyHeaderProps {
  currentLobby: Lobby | null
  lobbies: Lobby[]
  status: LobbySessionStatus
  onSwitchLobby: (slug: string) => void
  onToggleNotifications: () => void
  unreadCount: number
}

function LobbyHeader({
  currentLobby,
  lobbies,
  status,
  onSwitchLobby,
  onToggleNotifications,
  unreadCount,
}: LobbyHeaderProps) {
  return (
    <header className="lobby-header">
      <div className="lobby-header__top">
        <div>
          <h1>Game Lobby</h1>
          {currentLobby ? (
            <p className="lobby-header__subtitle">
              {currentLobby.title} ·{' '}
              {currentLobby.min_elo != null || currentLobby.max_elo != null
                ? `${currentLobby.min_elo ?? '0'} - ${currentLobby.max_elo ?? '∞'}`
                : 'All ratings'}
            </p>
          ) : (
            <p className="lobby-header__subtitle">Loading lobby…</p>
          )}
        </div>
        <div className="lobby-header__actions">
          <span className={`lobby-status lobby-status--${status}`}>{status === 'available' ? 'Available' : 'In game'}</span>
          <NotificationBell unreadCount={unreadCount} onClick={onToggleNotifications} />
        </div>
      </div>

      {lobbies.length > 1 && (
        <LobbyTabs
          lobbies={lobbies}
          activeLobbyId={currentLobby?.id}
          onSelect={onSwitchLobby}
        />
      )}
    </header>
  )
}

export default LobbyHeader
