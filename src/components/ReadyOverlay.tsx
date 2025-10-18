interface ReadyOverlayProps {
  onReady: () => void
  isReady: boolean
  opponentReady: boolean
  loading?: boolean
}

export default function ReadyOverlay({
  onReady,
  isReady,
  opponentReady,
  loading = false
}: ReadyOverlayProps) {
  const bothReady = isReady && opponentReady

  return (
    <div className="ready-overlay">
      <div className="ready-overlay-content">
        <h1 className="ready-title">
          {bothReady ? 'Game Starting!' : 'Get Ready'}
        </h1>

        {bothReady ? (
          <div className="both-ready-message">
            <div className="ready-spinner"></div>
            <p>Both players are ready! Starting game...</p>
          </div>
        ) : (
          <>
            <div className="ready-status">
              <div className={`player-status ${isReady ? 'ready' : 'not-ready'}`}>
                {isReady ? '✓' : '○'} You {isReady ? 'are ready' : ''}
              </div>
              <div className={`player-status ${opponentReady ? 'ready' : 'not-ready'}`}>
                {opponentReady ? '✓' : '○'} Opponent {opponentReady ? 'is ready' : ''}
              </div>
            </div>

            {!isReady && (
              <button
                onClick={onReady}
                disabled={loading}
                className="ready-button"
              >
                {loading ? 'Getting Ready...' : "I'm Ready!"}
              </button>
            )}

            {isReady && !opponentReady && (
              <p className="waiting-message">Waiting for opponent to ready up...</p>
            )}
          </>
        )}
      </div>

      <style>{`
        .ready-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .ready-overlay-content {
          text-align: center;
          padding: 3rem;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          max-width: 500px;
          width: 90%;
        }

        .ready-title {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ready-status {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .player-status {
          font-size: 1.2rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          background: #2a2a2a;
          transition: all 0.3s;
        }

        .player-status.ready {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          font-weight: bold;
        }

        .player-status.not-ready {
          color: #888;
        }

        .ready-button {
          padding: 1rem 3rem;
          font-size: 1.3rem;
          font-weight: bold;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
          transition: all 0.3s;
        }

        .ready-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(72, 187, 120, 0.6);
        }

        .ready-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .waiting-message {
          font-size: 1.1rem;
          color: #aaa;
          margin-top: 1rem;
        }

        .both-ready-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .both-ready-message p {
          font-size: 1.2rem;
          color: #48bb78;
        }

        .ready-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #2a2a2a;
          border-top: 4px solid #48bb78;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .ready-title {
            font-size: 2rem;
          }

          .ready-button {
            padding: 0.875rem 2.5rem;
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  )
}
