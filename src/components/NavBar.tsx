import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import '../styles/navbar.css'

function NavBar() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const closeMenu = () => setOpen(false)

  const scrollToTop = () => {
    // If not on homepage, navigate to homepage first
    if (location.pathname !== '/') {
      navigate('/')
      return
    }

    const homePageElement = document.querySelector('.home-page')
    if (homePageElement) {
      homePageElement.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // Clear the hash from URL
    window.history.pushState('', document.title, window.location.pathname)
    setActiveHash('')
    closeMenu()
  }

  const handleLearnMoreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    // If not on homepage, navigate to homepage with hash
    if (location.pathname !== '/') {
      navigate('/#features')
      return
    }

    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.history.pushState('', document.title, '/#features')
    setActiveHash('#features')
    closeMenu()
  }

  const handleGameModesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    // If not on homepage, navigate to homepage with hash
    if (location.pathname !== '/') {
      navigate('/#game-modes')
      return
    }

    const gameModesSection = document.querySelector('.game-modes-section')
    if (gameModesSection) {
      gameModesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.history.pushState('', document.title, '/#game-modes')
    setActiveHash('#game-modes')
    closeMenu()
  }

  useEffect(() => {
    setActiveHash(location.hash)
  }, [location.hash])

  return (
    <nav className="navbar" role="navigation" aria-label="Main">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-brand" onClick={closeMenu}>
            <span>Chess Online</span>
          </Link>
          <ul className="nav-menu nav-menu-desktop">
            <li>
              <a href="/" className={activeHash === '' && location.pathname === '/' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToTop(); }}>
                Home
              </a>
            </li>
            <li>
              <a href="/#features" className={activeHash === '#features' ? 'active' : ''} onClick={handleLearnMoreClick}>Learn More</a>
            </li>
            <li>
              <a href="/#game-modes" className={activeHash === '#game-modes' ? 'active' : ''} onClick={handleGameModesClick}>Game Modes</a>
            </li>
          </ul>
        </div>

        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-bar" />
          <span className="menu-bar" />
          <span className="menu-bar" />
        </button>

        <div className="nav-cta nav-cta-desktop">
          <Link to="/login" className="nav-btn nav-btn-outline" onClick={closeMenu}>
            Log In
          </Link>
          <Link to="/login?signup=true" className="nav-btn nav-btn-primary" onClick={closeMenu}>
            Sign Up
          </Link>
        </div>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <ul className="nav-menu">
            <li>
              <a href="/" className={activeHash === '' && location.pathname === '/' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToTop(); }}>
                Home
              </a>
            </li>
            <li>
              <a href="/#features" className={activeHash === '#features' ? 'active' : ''} onClick={handleLearnMoreClick}>Learn More</a>
            </li>
            <li>
              <a href="/#game-modes" className={activeHash === '#game-modes' ? 'active' : ''} onClick={handleGameModesClick}>Game Modes</a>
            </li>
          </ul>
          <div className="nav-cta">
            <Link to="/login" className="nav-btn nav-btn-outline" onClick={closeMenu}>
              Log In
            </Link>
            <Link to="/login?signup=true" className="nav-btn nav-btn-primary" onClick={closeMenu}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
