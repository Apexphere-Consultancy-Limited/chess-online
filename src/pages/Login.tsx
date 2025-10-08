import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function Login() {
  const { session, signInWithGoogle, signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [skillLevel, setSkillLevel] = useState('Beginner')
  const [isSignUp, setIsSignUp] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [search] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      const to = search.get('redirect') || '/game'
      navigate(to, { replace: true })
    }
  }, [session, search, navigate])

  useEffect(() => {
    if (search.get('signup') === 'true') {
      setIsSignUp(true)
    }
  }, [search])

  async function handleEmailPassword(e: FormEvent) {
    e.preventDefault()
    setStatus(null)
    try {
      if (isSignUp) {
        console.log('Signing up with skill level:', skillLevel)
        await signUpWithPassword(email, password, { name, skillLevel })
        setStatus('Account created! You can now sign in.')
      } else {
        await signInWithPassword(email, password)
      }
    } catch (err: any) {
      setStatus(err?.message ?? 'Authentication failed')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#ffffff',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '2.5rem',
        margin: 'auto',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/" style={{
            color: '#81b64c',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            ← Back to Home
          </Link>
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '2rem',
          color: '#1a1a1a',
        }}>
          {isSignUp ? 'Sign up' : 'Sign in'}
        </h1>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailPassword}>
          {isSignUp && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                marginBottom: '1rem',
                fontSize: '1rem',
                transition: 'border-color 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#81b64c'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          )}
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              marginBottom: '1rem',
              fontSize: '1rem',
              transition: 'border-color 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#81b64c'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              marginBottom: '1rem',
              fontSize: '1rem',
              transition: 'border-color 0.3s ease',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#81b64c'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          {isSignUp && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1a1a1a',
              }}>
                Chess Skill Level
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
              }}>
                {['New to Chess', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSkillLevel(level)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${skillLevel === level ? '#81b64c' : '#e5e7eb'}`,
                      background: skillLevel === level ? '#f0f9e8' : 'white',
                      color: skillLevel === level ? '#81b64c' : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: skillLevel === level ? 600 : 500,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseOver={(e) => {
                      if (skillLevel !== level) {
                        e.currentTarget.style.borderColor = '#81b64c'
                        e.currentTarget.style.background = '#f9fafb'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (skillLevel !== level) {
                        e.currentTarget.style.borderColor = '#e5e7eb'
                        e.currentTarget.style.background = 'white'
                      }
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 0,
              background: '#81b64c',
              color: 'white',
              cursor: 'pointer',
              marginBottom: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#6a9a3d'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#81b64c'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {isSignUp ? 'Sign up' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setStatus(null)
            }}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#6b7280',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f9fafb'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white'
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </form>

        {/* OR Separator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '1.5rem 0',
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: '#e5e7eb',
          }} />
          <span style={{
            padding: '0 1rem',
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}>OR</span>
          <div style={{
            flex: 1,
            height: '1px',
            background: '#e5e7eb',
          }} />
        </div>

        {/* OAuth Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => void signInWithGoogle()}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              color: '#1a1a1a',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f9fafb'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Continue with Google
          </button>

          <button
            onClick={async () => {
              setStatus(null)
              try {
                await signInWithEmail(email)
                setStatus('Check your email for a magic link.')
              } catch (err: any) {
                setStatus(err?.message ?? 'Failed to send magic link')
              }
            }}
            disabled={!email}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: email ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: 500,
              color: email ? '#1a1a1a' : '#9ca3af',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: email ? 1 : 0.6,
            }}
            onMouseOver={(e) => {
              if (email) {
                e.currentTarget.style.background = '#f9fafb'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Send Magic Link
          </button>
        </div>

        {status && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            background: '#f9fafb',
            color: '#1a1a1a',
            border: '1px solid #e5e7eb',
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  )
}

