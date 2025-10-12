import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import NavBar from '../components/NavBar'
import '../styles/home.css'

function Home() {
  const location = useLocation()

  useEffect(() => {
    // Handle hash navigation
    if (location.hash === '#features') {
      const featuresSection = document.getElementById('features')
      if (featuresSection) {
        setTimeout(() => {
          featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } else if (location.hash === '#game-modes') {
      const gameModesSection = document.querySelector('.game-modes-section')
      if (gameModesSection) {
        setTimeout(() => {
          gameModesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } else {
      // Scroll to top when no hash
      const homePageElement = document.querySelector('.home-page')
      if (homePageElement) {
        homePageElement.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [location.hash])

  return (
    <div className="home-page">
      <NavBar />

      {/* Section 1: Hero Welcome */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            Play Chess
            <br />
            <span className="hero-highlight">Online</span>
          </h1>
          <p className="hero-subtitle">
            Challenge friends or test your skills against our AI.
          </p>
          <p className="hero-tagline">
            Free, fast, and fun chess for everyone.
          </p>
          <div className="hero-buttons">
            <Link to="/online" className="btn-hero btn-hero-bot">
              <span>Play Online</span>
            </Link>
            <Link to="/game" className="btn-hero btn-hero-primary">
              <span>Play vs Bot</span>
            </Link>
            <Link to="/learning" className="btn-hero btn-hero-secondary">🧩 Puzzles</Link>
            <a href="#features" className="btn-hero btn-hero-outline">Learn More</a>
          </div>

          <div className="scroll-indicator">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </section>

      {/* Section 2: Features */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Chess Online?</h2>
            <p className="section-subtitle">Everything you need for an amazing chess experience, all in one place</p>
          </div>
          <div className="features-grid">
            <div className="feature-card feature-blue">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Play with Friends</h3>
              <p className="feature-description">
                Challenge a friend on the same device. Perfect for learning and casual games.
              </p>
            </div>
            <div className="feature-card feature-purple">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Opponents</h3>
              <p className="feature-description">
                Play against our AI with multiple difficulty levels, from beginner to advanced.
              </p>
            </div>
            <div className="feature-card feature-yellow">
              <div className="feature-icon">💡</div>
              <h3 className="feature-title">Smart Hints</h3>
              <p className="feature-description">
                Get helpful hints when you're stuck. Perfect for learning and improving your game.
              </p>
            </div>
            <div className="feature-card feature-green">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Fast & Smooth</h3>
              <p className="feature-description">
                Lightweight design means fast loading and smooth gameplay on any device.
              </p>
            </div>
            <div className="feature-card feature-red">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Valid Move Hints</h3>
              <p className="feature-description">
                See all valid moves for each piece. Great for beginners learning the rules.
              </p>
            </div>
            <div className="feature-card feature-indigo">
              <div className="feature-icon">🔄</div>
              <h3 className="feature-title">Undo Moves</h3>
              <p className="feature-description">
                Made a mistake? No problem! Undo your last move and try a different strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Game Modes */}
      <section className="game-modes-section">
        <div className="game-modes-background">
          <div className="modes-orb modes-orb-1"></div>
          <div className="modes-orb modes-orb-2"></div>
        </div>

        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title section-title-light">Choose Your Game Mode</h2>
            <p className="section-subtitle section-subtitle-light">Pick the perfect challenge for your skill level</p>
          </div>
          <div className="modes-grid">
            <div className="mode-card">
              <div className="mode-icon">👥</div>
              <h3 className="mode-title">vs Friend</h3>
              <p className="mode-description">
                Play against a friend on the same device
              </p>
              <ul className="mode-features">
                <li>
                  <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Two human players</span>
                </li>
                <li>
                  <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Turn-based gameplay</span>
                </li>
                <li>
                  <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Perfect for learning</span>
                </li>
              </ul>
            </div>

            <div className="mode-card mode-featured">
              <div className="mode-badge">Most Popular</div>
              <div className="mode-icon">🤖</div>
              <h3 className="mode-title">vs AI</h3>
              <p className="mode-description">
                Challenge our intelligent chess engine
              </p>
              <ul className="mode-features">
                <li>
                  <svg className="checkmark checkmark-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Easy, Medium & Hard levels</span>
                </li>
                <li>
                  <svg className="checkmark checkmark-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Powered by Stockfish</span>
                </li>
                <li>
                  <svg className="checkmark checkmark-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Adaptive difficulty</span>
                </li>
              </ul>
            </div>

            <div className="mode-card">
              <div className="mode-icon">🔥</div>
              <h3 className="mode-title">AI Hard</h3>
              <p className="mode-description">
                Test your skills against advanced AI
              </p>
              <ul className="mode-features">
                <li>
                  <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Deep analysis</span>
                </li>
                <li>
                  <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Challenging gameplay</span>
                </li>
                <li>
                  <svg className="checkmark" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>For experienced players</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="cta-center">
            <Link to="/online" className="btn-large btn-hero-light-bot">
              <span>Play Online</span>
            </Link>
            <Link to="/game" className="btn-large btn-hero-light">
              <span>Play vs Bot</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
