import React, { useEffect, useState } from 'react'
import { GameMode } from '../types/chess'
import easyBotIdle1 from '../resources/easy-bot/easy-bot-idle-1.gif'
import easyBotIdle2 from '../resources/easy-bot/easy-bot-idle-2.gif'
import easyBotCelebrate from '../resources/easy-bot/easy-bot-celebrate.gif'
import easyBotCapture from '../resources/easy-bot/easy-bot-capture-piece.gif'
import easyBotLost from '../resources/easy-bot/easy-bot-lost-piece.gif'
import easyBotCheck from '../resources/easy-bot/easy-bot-check.gif'
import easyBotScared from '../resources/easy-bot/easy-bot-scared.gif'
import easyBotThinking from '../resources/easy-bot/easy-bot-thinking.gif'
import mediumBotIdle from '../resources/medium-bot/medium-bot-idle.gif'
import mediumBotWin from '../resources/medium-bot/medium-bot-win.gif'
import mediumBotCapture from '../resources/medium-bot/medium-bot-capture-piece.gif'
import mediumBotLostPiece from '../resources/medium-bot/medium-bot-lost-piece.gif'
import mediumBotScared from '../resources/medium-bot/medium-bot-scared.gif'
import mediumBotCheck from '../resources/medium-bot/medium-bot-check.gif'
import mediumBotLostGame from '../resources/medium-bot/medium-bot-lost-game.gif'
import mediumBotThinking from '../resources/medium-bot/medium-bot-thinking.gif'
import hardBotIdle from '../resources/hard-bot/hard-bot-idle-1.gif'
import hardBotCelebrate from '../resources/hard-bot/hard-bot-celebrate.gif'
import hardBotCapture from '../resources/hard-bot/hard-bot-capture-piece.gif'
import hardBotLostPiece from '../resources/hard-bot/hard-bot-lost-piece.gif'
import hardBotCheck from '../resources/hard-bot/hard-bot-check.gif'
import hardBotThinking from '../resources/hard-bot/hard-bot-thinking.gif'

interface BotChatProps {
  moveCount: number
  lastMove: string
  currentPlayer: 'white' | 'black'
  gameOver: boolean
  winner: 'white' | 'black' | 'draw' | null
  gameMode: GameMode
  inCheck?: boolean
  lastMoveCapture?: boolean
  isComputerThinking?: boolean
}

interface BotProfile {
  name: string
  avatar: string | BotAvatarStates
  avatarType: 'emoji' | 'image'
  avatarBg: string
  rating: number
  greeting: string
  thinkingMessages: string[]
  responseMessages: string[]
  encouragementMessages: string[]
  winMessage: string
  loseMessage: string
  drawMessage: string
}

interface BotAvatarStates {
  idle: string
  celebrate: string
  capture: string
  lostPiece: string
  check: string
  scared: string
  thinking: string
  lostGame?: string
}

const BOT_PROFILES: Record<string, BotProfile> = {
  'ai-easy': {
    name: 'Botley',
    avatar: {
      idle: easyBotIdle1,
      celebrate: easyBotCelebrate,
      capture: easyBotCapture,
      lostPiece: easyBotLost,
      check: easyBotCheck,
      scared: easyBotScared,
      thinking: easyBotThinking
    },
    avatarType: 'image',
    avatarBg: 'linear-gradient(135deg, #A8E6CF 0%, #56CCF2 100%)',
    rating: 400,
    greeting: "Hi friend! I'm Botley! Ready to have some fun playing chess?",
    thinkingMessages: [
      "Hmm, let me think...",
      "What should I do here?",
      "Thinking, thinking...",
      "Oh! Maybe this move?",
      "Let me try something!"
    ],
    responseMessages: [
      "Your turn!",
      "How was that move?",
      "Okay, what will you do?",
      "This is exciting!",
      "I'm having fun!"
    ],
    encouragementMessages: [
      "Take your time!",
      "You can do it!",
      "Good thinking!",
      "This is fun!",
      "I'm excited to see your move!"
    ],
    winMessage: "Yay! I won! That was so much fun!",
    loseMessage: "Wow! You're really good! Great game!",
    drawMessage: "A tie! We both played well!"
  },
  'ai-medium': {
    name: 'Chill Cat',
    avatar: {
      idle: mediumBotIdle,
      celebrate: mediumBotWin,
      capture: mediumBotCapture,
      lostPiece: mediumBotLostPiece,
      check: mediumBotCheck,
      scared: mediumBotScared,
      thinking: mediumBotThinking,
      lostGame: mediumBotLostGame
    },
    avatarType: 'image',
    avatarBg: 'linear-gradient(135deg, #6A0572 0%, #AB47BC 100%)',
    rating: 1200,
    greeting: "Hey there. I'm Chill Cat. Let's play some chess.",
    thinkingMessages: [
      "Hmm, let me think...",
      "Easy does it... analyzing...",
      "Interesting...",
      "Cool, cool... I got this.",
      "Just vibing and thinking..."
    ],
    responseMessages: [
      "There we go. Your turn.",
      "Not bad. What's your next move?",
      "Your move.",
      "Smooth. Let's see what you do.",
      "Alright, show me what you got."
    ],
    encouragementMessages: [
      "Take your time, no rush.",
      "Think it through.",
      "Stay cool and focused.",
      "You got this.",
      "Make your move when ready."
    ],
    winMessage: "Good game. That was chill.",
    loseMessage: "Nice! You played well. Respect.",
    drawMessage: "A draw? Cool, cool. Good game!"
  },
  'ai-hard': {
    name: 'Blaze Master',
    avatar: {
      idle: hardBotIdle,
      celebrate: hardBotCelebrate,
      capture: hardBotCapture,
      lostPiece: hardBotLostPiece,
      check: hardBotCheck,
      scared: hardBotLostPiece,
      thinking: hardBotThinking
    },
    avatarType: 'image',
    avatarBg: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    rating: 2000,
    greeting: "I am Blaze Master. Feel the heat of my strategy!",
    thinkingMessages: [
      "The flames of calculation burn bright...",
      "My mustache tingles... victory is near!",
      "Burning through all possibilities...",
      "The fire within guides my moves...",
      "Igniting a devastating sequence..."
    ],
    responseMessages: [
      "Feel the burn!",
      "Can you handle the heat?",
      "My flames grow stronger!",
      "The board is ablaze!",
      "Witness my fiery tactics!"
    ],
    encouragementMessages: [
      "Show me your strength!",
      "Don't get burned!",
      "The heat intensifies...",
      "Can you withstand the pressure?",
      "Make your move... if you dare!"
    ],
    winMessage: "Victory! The flames consume the board!",
    loseMessage: "Impressive! You extinguished my flames!",
    drawMessage: "A stalemate! We are both masters of fire!"
  }
}

const BotChat: React.FC<BotChatProps> = ({ moveCount, lastMove, currentPlayer, gameOver, winner, gameMode, inCheck, lastMoveCapture, isComputerThinking }) => {
  const botProfile = BOT_PROFILES[gameMode] || BOT_PROFILES['ai-easy']
  const [message, setMessage] = useState(botProfile.greeting)
  const [isThinking, setIsThinking] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState<'idle' | 'celebrate' | 'capture' | 'lostPiece' | 'check' | 'scared' | 'thinking' | 'lostGame'>('idle')

  // Reset message when bot profile changes
  useEffect(() => {
    setMessage(botProfile.greeting)
    setIsThinking(false)
  }, [gameMode, botProfile.greeting])

  // Determine emotion based on game state
  useEffect(() => {
    // Clear any existing timeouts
    let emotionTimeout: number | undefined

    if (gameOver) {
      if (winner === 'black') {
        setCurrentEmotion('celebrate')
      } else if (winner === 'white') {
        // Use lostGame emotion if available, otherwise scared
        if (gameMode === 'ai-medium' && typeof botProfile.avatar === 'object' && botProfile.avatar.lostGame) {
          setCurrentEmotion('lostGame')
        } else {
          setCurrentEmotion('scared')
        }
      } else {
        setCurrentEmotion('idle')
      }
    } else if (isComputerThinking && currentPlayer === 'black') {
      // Bot is thinking - show thinking animation
      setCurrentEmotion('thinking')
    } else if (inCheck && currentPlayer === 'black') {
      // Bot is in check - show scared
      setCurrentEmotion('scared')
    } else if (currentPlayer === 'white') {
      // It's player's turn - bot has finished its move
      if (inCheck) {
        // Bot gave check
        setCurrentEmotion('check')
        emotionTimeout = window.setTimeout(() => setCurrentEmotion('idle'), 3000)
      } else if (lastMoveCapture && moveCount > 0) {
        // Bot just captured a piece
        setCurrentEmotion('capture')
        emotionTimeout = window.setTimeout(() => setCurrentEmotion('idle'), 3000)
      } else {
        // Bot finished normal move - show idle
        setCurrentEmotion('idle')
      }
    } else if (currentPlayer === 'black' && lastMoveCapture && !isComputerThinking) {
      // Bot's turn and just lost a piece
      setCurrentEmotion('lostPiece')
      emotionTimeout = window.setTimeout(() => setCurrentEmotion('idle'), 3000)
    } else {
      setCurrentEmotion('idle')
    }

    return () => {
      if (emotionTimeout) {
        window.clearTimeout(emotionTimeout)
      }
    }
  }, [gameOver, winner, inCheck, lastMoveCapture, currentPlayer, moveCount, isComputerThinking, gameMode, botProfile])

  useEffect(() => {
    if (gameOver) {
      if (winner === 'black') {
        setMessage(botProfile.winMessage)
      } else if (winner === 'white') {
        setMessage(botProfile.loseMessage)
      } else {
        setMessage(botProfile.drawMessage)
      }
      setIsThinking(false)
      return
    }

    if (currentPlayer === 'black' && moveCount > 0) {
      setIsThinking(true)
      setMessage(botProfile.thinkingMessages[Math.floor(Math.random() * botProfile.thinkingMessages.length)])

      const timer = setTimeout(() => {
        setIsThinking(false)
        setMessage(botProfile.responseMessages[Math.floor(Math.random() * botProfile.responseMessages.length)])
      }, 1500)

      return () => clearTimeout(timer)
    } else if (currentPlayer === 'white' && moveCount > 0) {
      setMessage(botProfile.encouragementMessages[Math.floor(Math.random() * botProfile.encouragementMessages.length)])
      setIsThinking(false)
    }
  }, [moveCount, currentPlayer, gameOver, winner, botProfile])

  // Get current avatar based on emotion
  const getCurrentAvatar = () => {
    if (typeof botProfile.avatar === 'string') {
      return botProfile.avatar
    }
    // Return the emotion avatar, or fallback to idle if emotion not available
    return botProfile.avatar[currentEmotion] || botProfile.avatar.idle
  }

  return (
    <div className="bot-chat-container">
      <div className="bot-avatar">
        <div className="bot-image-wrapper" style={{ background: botProfile.avatarBg }}>
          {botProfile.avatarType === 'image' ? (
            <img
              src={getCurrentAvatar()}
              alt={botProfile.name}
              className="bot-image-img"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                e.currentTarget.style.display = 'none'
                const fallback = document.createElement('div')
                fallback.className = 'bot-image'
                fallback.textContent = '👑'
                e.currentTarget.parentElement?.appendChild(fallback)
              }}
            />
          ) : (
            <div className="bot-image">{botProfile.avatar as string}</div>
          )}
        </div>
        <div className="bot-info">
          <div className="bot-name">{botProfile.name}</div>
          <div className="bot-rating">Rating: {botProfile.rating}</div>
        </div>
      </div>
      <div className="bot-message-bubble">
        <div className={`bot-message ${isThinking ? 'thinking' : ''}`}>
          {isThinking && <span className="thinking-dots">...</span>}
          {message}
        </div>
      </div>
    </div>
  )
}

export default BotChat
