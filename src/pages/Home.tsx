import { Link } from 'react-router-dom'

function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="logo">♔</span>
            <span className="brand-name">Chess Online</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <Link to="/game" className="btn-play-nav">Play Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Play Chess <span className="highlight">Online</span>
          </h1>
          <p className="hero-subtitle">
            Challenge friends or test your skills against our AI. Free, fast, and fun chess for everyone.
          </p>
          <div className="hero-buttons">
            <Link to="/game" className="btn-primary">
              <span>Play Online</span>
              <svg className="btn-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/learning" className="btn-secondary">🧩 Puzzles</Link>
            <a href="#features" className="btn-secondary">Learn More</a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">Game Modes</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Free to Play</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">∞</div>
              <div className="stat-label">Unlimited Games</div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-board">
            <div className="mini-board">
              <div className="mini-square light">♔</div>
              <div className="mini-square dark"></div>
              <div className="mini-square light"></div>
              <div className="mini-square dark">♟</div>
              <div className="mini-square dark"></div>
              <div className="mini-square light">♜</div>
              <div className="mini-square dark"></div>
              <div className="mini-square light"></div>
              <div className="mini-square light"></div>
              <div className="mini-square dark">♙</div>
              <div className="mini-square light"></div>
              <div className="mini-square dark"></div>
              <div className="mini-square dark">♞</div>
              <div className="mini-square light"></div>
              <div className="mini-square dark"></div>
              <div className="mini-square light">♕</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Chess Online?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Play with Friends</h3>
              <p className="feature-description">
                Challenge a friend on the same device. Perfect for learning and casual games.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Opponents</h3>
              <p className="feature-description">
                Play against our AI with multiple difficulty levels, from beginner to advanced.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h3 className="feature-title">Smart Hints</h3>
              <p className="feature-description">
                Get helpful hints when you're stuck. Perfect for learning and improving your game.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Fast & Smooth</h3>
              <p className="feature-description">
                Lightweight design means fast loading and smooth gameplay on any device.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Valid Move Hints</h3>
              <p className="feature-description">
                See all valid moves for each piece. Great for beginners learning the rules.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3 className="feature-title">Undo Moves</h3>
              <p className="feature-description">
                Made a mistake? No problem! Undo your last move and try a different strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="game-modes">
        <div className="container">
          <h2 className="section-title">Choose Your Game Mode</h2>
          <div className="modes-grid">
            <div className="mode-card">
              <div className="mode-header">
                <div className="mode-icon">👥</div>
                <h3 className="mode-name">vs Friend</h3>
              </div>
              <p className="mode-info">Play against a friend on the same device</p>
              <ul className="mode-features">
                <li>Two human players</li>
                <li>Turn-based gameplay</li>
                <li>Perfect for learning</li>
              </ul>
            </div>
            <div className="mode-card featured">
              <div className="mode-badge">Popular</div>
              <div className="mode-header">
                <div className="mode-icon">🤖</div>
                <h3 className="mode-name">vs AI</h3>
              </div>
              <p className="mode-info">Challenge our intelligent chess engine</p>
              <ul className="mode-features">
                <li>Easy, Medium & Hard levels</li>
                <li>Powered by Stockfish</li>
                <li>Adaptive difficulty</li>
              </ul>
            </div>
            <div className="mode-card">
              <div className="mode-header">
                <div className="mode-icon">🔥</div>
                <h3 className="mode-name">AI Hard</h3>
              </div>
              <p className="mode-info">Test your skills against advanced AI</p>
              <ul className="mode-features">
                <li>Deep analysis</li>
                <li>Challenging gameplay</li>
                <li>For experienced players</li>
              </ul>
            </div>
          </div>
          <div className="cta-center">
            <Link to="/game" className="btn-primary btn-large">Start Playing Now</Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">About Chess Online</h2>
              <p className="about-description">
                Chess Online is a free, modern chess platform designed for players of all skill levels.
                Whether you're just learning the game or you're an experienced player, our intuitive
                interface and powerful features make it easy to enjoy the timeless game of chess.
              </p>
              <p className="about-description">
                Built with modern web technologies, Chess Online offers a smooth, responsive experience
                on any device. No downloads, no registration required - just pure chess enjoyment.
              </p>
              <div className="about-features">
                <div className="about-feature">
                  <svg className="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>100% Free to Play</span>
                </div>
                <div className="about-feature">
                  <svg className="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>No Registration Required</span>
                </div>
                <div className="about-feature">
                  <svg className="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Works on All Devices</span>
                </div>
                <div className="about-feature">
                  <svg className="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Open Source Project</span>
                </div>
              </div>
            </div>
            <div className="about-image">
              <div className="chess-pieces">
                <div className="piece-display">♔</div>
                <div className="piece-display">♕</div>
                <div className="piece-display">♖</div>
                <div className="piece-display">♗</div>
                <div className="piece-display">♘</div>
                <div className="piece-display">♙</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="logo">♔</span>
              <span className="brand-name">Chess Online</span>
            </div>
            <div className="footer-text">
              <p>© 2025 Chess Online. An educational project for learning chess.</p>
              <p>Built with modern web technologies. Open source and free forever.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Home
