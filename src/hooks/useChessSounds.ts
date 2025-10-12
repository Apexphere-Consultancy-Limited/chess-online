import { useEffect } from 'react'
import { initializeSounds, playMoveSound, playCaptureSound, playCheckSound, playCheckmateSound } from '../utils/soundEffects'

/**
 * Custom hook to handle chess sound effects
 * Initializes sounds on mount and provides sound playing functions
 */
export function useChessSounds() {
  // Initialize sounds when the hook is first used
  useEffect(() => {
    initializeSounds()
  }, [])

  return {
    playMoveSound,
    playCaptureSound,
    playCheckSound,
    playCheckmateSound,
  }
}
