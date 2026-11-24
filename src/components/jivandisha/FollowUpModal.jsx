import React from 'react'
import FollowUpDatePresets from './FollowUpDatePresets'
import FollowUpContactInputs from './FollowUpContactInputs'

export default function FollowUpModal({
  followUpModalOpen,
  setFollowUpModalOpen,
  followUpLocation,
  handleSaveFollowUp,
  handleSetFollowUpDatePreset,
  followUpForm,
  setFollowUpForm,
  isSavingFollowUp
}) {
  if (!followUpModalOpen || !followUpLocation) return null

  const locationDetails = [
    followUpLocation.city,
    followUpLocation.state,
    followUpLocation.country === 'US' ? 'USA' : 'India'
  ].filter(Boolean).join(', ')

  return (
    <div className="jd-modal-overlay" onClick={() => setFollowUpModalOpen(false)}>
      <div className="jd-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="jd-modal-header">
          <h3>📅 Set Next Follow-Up: {followUpLocation.title}</h3>
          <button className="jd-modal-close" onClick={() => setFollowUpModalOpen(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveFollowUp}>
          <div className="jd-modal-body">
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
              📍 {locationDetails}
            </div>

            <FollowUpDatePresets onSelectPreset={handleSetFollowUpDatePreset} />

            <div className="jd-form-group">
              <label>Next Follow-Up Date</label>
              <input
                type="date"
                value={followUpForm.next_follow_up_date}
                onChange={(e) => setFollowUpForm((prev) => ({ ...prev, next_follow_up_date: e.target.value }))}
              />
            </div>

            <div className="jd-form-group">
              <label>Remarks & Follow-up Notes</label>
              <textarea
                rows={4}
                placeholder="Enter discussion notes, commitments, requirements discussed, next steps..."
                value={followUpForm.remarks}
                onChange={(e) => setFollowUpForm((prev) => ({ ...prev, remarks: e.target.value }))}
              />
            </div>

            <FollowUpContactInputs followUpForm={followUpForm} setFollowUpForm={setFollowUpForm} />
          </div>

          <div className="jd-modal-footer">
            <button type="button" className="jd-btn" onClick={() => setFollowUpModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="jd-btn primary" disabled={isSavingFollowUp}>
              {isSavingFollowUp ? 'Saving...' : '💾 Save Follow-Up Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
