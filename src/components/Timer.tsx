import { PieceColor } from '../types/chess'

interface TimerProps {
  color: PieceColor
  timeLeft: number
  isActive: boolean
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default function Timer({ color, timeLeft, isActive }: TimerProps) {
  const isLowTime = timeLeft <= 60
  const isCritical = timeLeft <= 10

  return (
    <div className={`timer ${color}-timer ${isActive ? 'active' : ''} ${isLowTime ? 'low-time' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="timer-label">{color === 'white' ? 'White' : 'Black'}</div>
      <div className="timer-display">{formatTime(timeLeft)}</div>
    </div>
  )
}
