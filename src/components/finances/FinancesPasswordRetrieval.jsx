import React from 'react';

export default function FinancesPasswordRetrieval({
  formData,
  setFormData,
  retrievedPassword,
  error,
  success,
  onBackToLogin,
  onRetrieve
}) {
  return (
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
        <button className="btn-cancel" onClick={onBackToLogin}>Back to Login</button>
        {!retrievedPassword && (
          <button className="btn-save" onClick={onRetrieve}>Retrieve Password</button>
        )}
      </div>
    </div>
  );
}
