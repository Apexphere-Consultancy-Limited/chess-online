import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import ConfirmationModal from './ConfirmationModal'
import '../styles/navbar.css'

function NavBar() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
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
    <>
      {showLogoutModal && (
        <ConfirmationModal
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmText="Sign Out"
          cancelText="Cancel"
          onConfirm={() => {
            signOut()
            setShowLogoutModal(false)
            closeMenu()
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

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
              <NavLink to="/online" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                Play Online
              </NavLink>
            </li>
            <li>
              <NavLink to="/game" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                Play vs Bot
              </NavLink>
            </li>
            <li>
              <NavLink to="/learning" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                Puzzles
              </NavLink>
            </li>
            <li>
              <a href="/#features" className={activeHash === '#features' ? 'active' : ''} onClick={handleLearnMoreClick}>Learn More</a>
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
          {user ? (
            <div className="user-profile">
              <Link to="/profile" className="user-profile-link">
                <img
                  src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email || 'User')}&background=81b64c&color=fff`}
                  alt="User avatar"
                  className="user-avatar"
                />
                <span className="user-name">{user.user_metadata?.full_name || user.email}</span>
              </Link>
              <button onClick={() => setShowLogoutModal(true)} className="nav-btn nav-btn-outline">
                Log Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-btn nav-btn-outline" onClick={closeMenu}>
                Log In
              </Link>
              <Link to="/login?signup=true" className="nav-btn nav-btn-primary" onClick={closeMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <ul className="nav-menu">
            <li>
              <a href="/" className={activeHash === '' && location.pathname === '/' ? 'active' : ''} onClick={(e) => { e.preventDefault(); scrollToTop(); }}>
                Home
              </a>
            </li>
            <li>
              <NavLink to="/online" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                Play Online
              </NavLink>
            </li>
            <li>
              <NavLink to="/game" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                Play vs Bot
              </NavLink>
            </li>
            <li>
              <NavLink to="/learning" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenu}>
                Puzzles
              </NavLink>
            </li>
            <li>
              <a href="/#features" className={activeHash === '#features' ? 'active' : ''} onClick={handleLearnMoreClick}>Learn More</a>
            </li>
          </ul>
          <div className="nav-cta">
            {user ? (
              <div className="user-profile-mobile">
                <Link to="/profile" className="user-profile-link" onClick={closeMenu}>
                  <img
                    src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email || 'User')}&background=81b64c&color=fff`}
                    alt="User avatar"
                    className="user-avatar"
                  />
                  <span className="user-name">{user.user_metadata?.full_name || user.email}</span>
                </Link>
                <button onClick={() => setShowLogoutModal(true)} className="nav-btn nav-btn-outline">
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-btn nav-btn-outline" onClick={closeMenu}>
                  Log In
                </Link>
                <Link to="/login?signup=true" className="nav-btn nav-btn-primary" onClick={closeMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  )
}

export default NavBar
