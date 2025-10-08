import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import Login from './pages/Login'
import Profile from './pages/Profile'
import { AuthProvider } from './auth/AuthProvider'
import Lobby from './pages/Lobby'
import RequireAuth from './auth/RequireAuth'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game/:gameId" element={<Game />} />
          <Route
            path="/lobby"
            element={
              <RequireAuth>
                <Lobby />
              </RequireAuth>
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
