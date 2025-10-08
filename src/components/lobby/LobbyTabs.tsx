import type { Lobby } from '../../types/lobby'

interface LobbyTabsProps {
  lobbies: Lobby[]
  activeLobbyId?: string
  onSelect: (slug: string) => void
  disabled?: boolean
}

function formatRange(min: number | null, max: number | null) {
  if (min == null && max == null) return 'All ratings'
  if (min != null && max != null) return `${min} - ${max}`
  if (min != null) return `${min}+`
  return `≤ ${max}`
}

function LobbyTabs({ lobbies, activeLobbyId, onSelect, disabled }: LobbyTabsProps) {
  return (
    <div className="lobby-tabs" role="tablist" aria-label="Lobby selection">
      {lobbies.map((lobby) => {
        const isActive = lobby.id === activeLobbyId
        return (
          <button
            key={lobby.id}
            role="tab"
            type="button"
            className={`lobby-tab${isActive ? ' lobby-tab--active' : ''}`}
            aria-selected={isActive}
            onClick={() => onSelect(lobby.slug)}
            disabled={disabled || isActive}
          >
            <span className="lobby-tab__title">{lobby.title}</span>
            <span className="lobby-tab__meta">{formatRange(lobby.min_elo, lobby.max_elo)}</span>
          </button>
        )
      })}
    </div>
  )
}

export default LobbyTabs
