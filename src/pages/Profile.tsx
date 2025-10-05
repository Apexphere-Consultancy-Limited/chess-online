import { useAuth } from '../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import NavBar from '../components/NavBar'
import ConfirmationModal from '../components/ConfirmationModal'
import '../styles/profile.css'

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/profile')
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  const skillLevel = user.user_metadata?.skill_level || 'Not specified'
  const fullName = user.user_metadata?.full_name || 'Not specified'
  const email = user.email || 'Not specified'
  const avatarUrl = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || email)}&background=81b64c&color=fff&size=200`
  const createdAt = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="profile-page">
      <NavBar />

      {showLogoutModal && (
        <ConfirmationModal
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmText="Sign Out"
          cancelText="Cancel"
          onConfirm={() => {
            signOut()
            navigate('/')
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <img src={avatarUrl} alt="User avatar" className="profile-avatar" />
            <h1 className="profile-name">{fullName}</h1>
            <p className="profile-email">{email}</p>
          </div>

          <div className="profile-info">
            <div className="info-section">
              <h2 className="section-title">Account Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{fullName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Chess Skill Level</span>
                  <span className="info-value skill-badge">{skillLevel}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since</span>
                  <span className="info-value">{createdAt}</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn-secondary" onClick={() => navigate('/game')}>
                Play Chess
              </button>
              <button className="btn-danger" onClick={() => setShowLogoutModal(true)}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
