// Chess sound effects using extracted audio files
// Uses individual 1-second sound files for instant playback

const moveSound = '/assets/sounds/move.mp3'
const captureSound = '/assets/sounds/capture.mp3'
const checkSound = '/assets/sounds/check.mp3'

let audioContext: AudioContext | null = null
let moveAudioBuffer: AudioBuffer | null = null
let captureAudioBuffer: AudioBuffer | null = null
let checkAudioBuffer: AudioBuffer | null = null
let isPreloading = false
let isPreloaded = false

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

// Load audio files
const loadAudioFile = async (url: string): Promise<AudioBuffer | null> => {
  try {
    const ctx = getAudioContext()
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    return await ctx.decodeAudioData(arrayBuffer)
  } catch (error) {
    console.warn('Could not load audio file:', url, error)
    return null
  }
}

// Preload all sounds for instant playback
const preloadSounds = async () => {
  if (isPreloading || isPreloaded) return
  isPreloading = true

  try {
    const [move, capture, check] = await Promise.all([
      loadAudioFile(moveSound),
      loadAudioFile(captureSound),
      loadAudioFile(checkSound)
    ])

    moveAudioBuffer = move
    captureAudioBuffer = capture
    checkAudioBuffer = check
    isPreloaded = true
    console.log('All sounds preloaded successfully')
  } catch (error) {
    console.warn('Could not preload sounds:', error)
  } finally {
    isPreloading = false
  }
}

// Initialize sounds - call this when the game component mounts
export const initializeSounds = () => {
  console.log('Initializing sounds...')
  const ctx = getAudioContext()

  // Resume audio context on user interaction
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  // Start preloading immediately
  preloadSounds()
}

// Play audio buffer
const playAudioBuffer = (buffer: AudioBuffer | null, volume: number = 0.6) => {
  if (!buffer) return

  try {
    const ctx = getAudioContext()
    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gainNode = ctx.createGain()
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(ctx.destination)

    source.start(0)
  } catch (error) {
    console.warn('Could not play audio:', error)
  }
}

// Play a move sound (normal piece placement)
export const playMoveSound = () => {
  // Resume audio context if suspended (browser autoplay policy)
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  // Preload on first use (non-blocking)
  if (!isPreloaded && !isPreloading) {
    preloadSounds()
  }

  // Play immediately if buffer is ready, otherwise skip (will be ready for next move)
  if (moveAudioBuffer) {
    playAudioBuffer(moveAudioBuffer, 1.0)
  }
}

// Play a capture sound (piece taking another piece)
export const playCaptureSound = () => {
  // Resume audio context if suspended
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  // Preload on first use (non-blocking)
  if (!isPreloaded && !isPreloading) {
    preloadSounds()
  }

  // Play immediately if buffer is ready
  if (captureAudioBuffer) {
    playAudioBuffer(captureAudioBuffer, 1.0)
  }
}

// Play a check sound (giving check)
export const playCheckSound = () => {
  // Resume audio context if suspended
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  // Preload on first use (non-blocking)
  if (!isPreloaded && !isPreloading) {
    preloadSounds()
  }

  // Play immediately if buffer is ready
  if (checkAudioBuffer) {
    playAudioBuffer(checkAudioBuffer, 1.0)
  }
}

// Play a checkmate sound (game over)
export const playCheckmateSound = () => {
  try {
    const ctx = getAudioContext()

    // Play a triumphant C major chord arpeggiated
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq

      const startTime = ctx.currentTime + (index * 0.1)
      gain.gain.setValueAtTime(0.25, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.35)
    })
  } catch (error) {
    console.warn('Could not play checkmate sound:', error)
  }
}

