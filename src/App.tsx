import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import Login from './pages/Login'
import Profile from './pages/Profile'
import LearningMode from './pages/LearningMode'
import TestGame from './pages/TestGame'
import { AuthProvider } from './auth/AuthProvider'
import OnlineRouter from './pages/OnlineRouter'
import OnlineGamePage from './pages/OnlineGamePage'
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
                <OnlineGamePage />
              </RequireAuth>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learning" element={<LearningMode />} />
          <Route path="/test" element={<TestGame />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
