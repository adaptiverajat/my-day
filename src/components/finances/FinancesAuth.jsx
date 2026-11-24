import React from 'react'
import AppLogoMenu from '../AppLogoMenu'

export default function FinancesAuth({
  isPasswordRetrieval,
  setIsPasswordRetrieval,
  userExists,
  formData,
  setFormData,
  retrievedPassword,
  error,
  setError,
  success,
  passwordKeydownCount,
  setPasswordKeydownCount,
  handlePasswordRetrieval,
  handleLogin,
  handleSetup,
  navigate
}) {
  return (
    <div className="finances-page">
      <div className="finances-header finances-auth-header">
        <AppLogoMenu
          title="Finances"
          currentScreen="finances"
        />
        <div className="finances-header-controls">
          <button type="button" className="btn-back" onClick={() => navigate('/')}>Back to Calendar</button>
        </div>
      </div>
      <div className="finances-auth-container">
        {isPasswordRetrieval ? (
          <div className="password-retrieval">
            <h2>Retrieve Password</h2>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                id="retrieval-email-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-notification-area">
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
            </div>
            {retrievedPassword && (
              <div className="retrieved-password">
                <label>Your password:</label>
                <div className="password-display">{retrievedPassword}</div>
              </div>
            )}
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setIsPasswordRetrieval(false)}>Back to Login</button>
              {!retrievedPassword && (
                <button className="btn-save" onClick={handlePasswordRetrieval}>Retrieve Password</button>
              )}
            </div>
          </div>
        ) : userExists ? (
          <form className="login-form" onSubmit={(e) => {
            e.preventDefault()
            if (passwordKeydownCount < 3) {
              setError('Please type your password manually')
              return
            }
            handleLogin()
          }}>
            <h2>Login to Access Finances</h2>
            <input
              type="hidden"
              id="login-email-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                id="login-password-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onKeyDown={(e) => {
                  setPasswordKeydownCount(c => c + 1)
                  if (e.key === 'Enter' && passwordKeydownCount + 1 >= 3) {
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
                onFocus={(e) => {
                  if (passwordKeydownCount === 0) {
                    setFormData({ ...formData, password: '' })
                    e.target.value = ''
                  }
                }}
                placeholder="password"
                autoComplete="off"
                autoFocus
              />
            </div>
            <div className="form-notification-area">
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
            </div>
            <div className="modal-buttons">
              <button type="button" className="btn-forgot" onClick={() => setIsPasswordRetrieval(true)}>Forgot Password?</button>
              <button type="button" className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
              <button
                type="submit"
                className="btn-save"
                disabled={passwordKeydownCount < 3}
              >
                Login
              </button>
            </div>
          </form>
        ) : (
          <div className="setup-form">
            <h2>Setup Finances Access</h2>
            <p>Create your account to access the Finances section. This will be the only account for this application.</p>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                id="setup-email-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                id="setup-password-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
              />
            </div>
            <div className="form-notification-area">
              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
              <button className="btn-save" onClick={handleSetup}>Create Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
