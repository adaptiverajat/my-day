import React from 'react';

export default function FinancesLoginForm({
  formData,
  setFormData,
  passwordKeydownCount,
  setPasswordKeydownCount,
  error,
  setError,
  success,
  handleLogin,
  onForgotPassword,
  onCancel
}) {
  return (
    <form
      className="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (passwordKeydownCount < 3) {
          setError('Please type your password manually');
          return;
        }
        handleLogin();
      }}
    >
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
            setPasswordKeydownCount(c => c + 1);
            if (e.key === 'Enter' && passwordKeydownCount + 1 >= 3) {
              e.currentTarget.form?.requestSubmit();
            }
          }}
          onFocus={(e) => {
            if (passwordKeydownCount === 0) {
              setFormData({ ...formData, password: '' });
              e.target.value = '';
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
        <button type="button" className="btn-forgot" onClick={onForgotPassword}>Forgot Password?</button>
        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button
          type="submit"
          className="btn-save"
          disabled={passwordKeydownCount < 3}
        >
          Login
        </button>
      </div>
    </form>
  );
}
