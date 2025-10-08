interface NotificationBellProps {
  unreadCount: number
  onClick: () => void
  ariaLabel?: string
}

function NotificationBell({ unreadCount, onClick, ariaLabel = 'Open notifications' }: NotificationBellProps) {
  const className = `notification-bell${unreadCount > 0 ? ' notification-bell--active' : ''}`
  return (
    <button
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3a6 6 0 0 0-6 6v2.586l-.707.707A1 1 0 0 0 6 14h12a1 1 0 0 0 .707-1.707L18 11.586V9a6 6 0 0 0-6-6Zm0 18a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Z"
        />
      </svg>
      {unreadCount > 0 && <span className="notification-bell__badge" aria-hidden="true">{unreadCount}</span>}
    </button>
  )
}

export default NotificationBell
