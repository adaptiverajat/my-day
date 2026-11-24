import React from 'react';
import AppLogoMenu from '../AppLogoMenu';
import FinancesPasswordRetrieval from './FinancesPasswordRetrieval';
import FinancesLoginForm from './FinancesLoginForm';

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
        <AppLogoMenu title="Finances" currentScreen="finances" />
        <div className="finances-header-controls">
          <button type="button" className="btn-back" onClick={() => navigate('/')}>Back to Calendar</button>
        </div>
      </div>
      <div className="finances-auth-container">
        {isPasswordRetrieval ? (
          <FinancesPasswordRetrieval
            formData={formData}
            setFormData={setFormData}
            retrievedPassword={retrievedPassword}
            error={error}
            success={success}
            onBackToLogin={() => setIsPasswordRetrieval(false)}
            onRetrieve={handlePasswordRetrieval}
          />
        ) : userExists ? (
          <FinancesLoginForm
            formData={formData}
            setFormData={setFormData}
            passwordKeydownCount={passwordKeydownCount}
            setPasswordKeydownCount={setPasswordKeydownCount}
            error={error}
            setError={setError}
            success={success}
            handleLogin={handleLogin}
            onForgotPassword={() => setIsPasswordRetrieval(true)}
            onCancel={() => navigate('/')}
          />
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
  );
}
