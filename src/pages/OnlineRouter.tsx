import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import Lobby from './Lobby'

/**
 * OnlineRouter component that checks for ongoing games and redirects accordingly.
 * If user has an ongoing game, redirects to /online/:gameId
 * Otherwise, shows the lobby.
 */
function OnlineRouter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [hasOngoingGame, setHasOngoingGame] = useState(false)

  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }

    async function checkOngoingGame() {
      try {
        console.log('Checking for ongoing games for user:', user.id)

        // Check for ongoing games where user is a player and game is not finished
        const { data, error } = await supabase
          .from('games')
          .select('id, status, white_player_id, black_player_id')
          .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
          .in('status', ['in_progress', 'waiting'])
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('Error checking for ongoing games:', error)
          setChecking(false)
          return
        }

        console.log('Ongoing games found:', data)

        // If there's an ongoing game, redirect to it
        if (data && data.length > 0) {
          const ongoingGame = data[0]
          console.log('Redirecting to game:', ongoingGame.id)
          setHasOngoingGame(true)
          navigate(`/online/${ongoingGame.id}`, { replace: true })
          return
        }

        // No ongoing game, show lobby
        console.log('No ongoing game found, showing lobby')
        setChecking(false)
      } catch (err) {
        console.error('Failed to check for ongoing games:', err)
        setChecking(false)
      }
    }

    checkOngoingGame()
  }, [user, navigate])

  if (checking || hasOngoingGame) {
    return (
      <div className="lobby-page lobby-page--loading">
        <p>{hasOngoingGame ? 'Joining game…' : 'Checking for ongoing games…'}</p>
      </div>
    )
  }

  return <Lobby />
}

export default OnlineRouter
