import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import Login from './pages/Login'
import Profile from './pages/Profile'
import LearningMode from './pages/LearningMode'
import { AuthProvider } from './auth/AuthProvider'
import OnlineRouter from './pages/OnlineRouter'
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
            path="/online"
            element={
              <RequireAuth>
                <OnlineRouter />
              </RequireAuth>
            }
          />
          <Route
            path="/online/:gameId"
            element={
              <RequireAuth>
                <Game />
              </RequireAuth>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learning" element={<LearningMode />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
