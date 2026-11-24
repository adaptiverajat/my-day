import React from 'react'

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

  return (
    <div className="jd-modal-overlay" onClick={() => setFollowUpModalOpen(false)}>
      <div className="jd-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="jd-modal-header">
          <h3>
            📅 Set Next Follow-Up: {followUpLocation.title}
          </h3>
          <button className="jd-modal-close" onClick={() => setFollowUpModalOpen(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveFollowUp}>
          <div className="jd-modal-body">
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
              📍 {[followUpLocation.city, followUpLocation.state, followUpLocation.country === 'US' ? 'USA' : 'India'].filter(Boolean).join(', ')}
            </div>

            {/* Quick Date Presets */}
            <div className="jd-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block' }}>
                Quick Presets for Follow-Up Date:
              </label>
              <div className="jd-preset-pills-row">
                <button type="button" className="jd-preset-pill" onClick={() => handleSetFollowUpDatePreset(0)}>
                  Today
                </button>
                <button type="button" className="jd-preset-pill" onClick={() => handleSetFollowUpDatePreset(1)}>
                  Tomorrow
                </button>
                <button type="button" className="jd-preset-pill" onClick={() => handleSetFollowUpDatePreset(3)}>
                  +3 Days
                </button>
                <button type="button" className="jd-preset-pill" onClick={() => handleSetFollowUpDatePreset(7)}>
                  +1 Week
                </button>
                <button type="button" className="jd-preset-pill" onClick={() => handleSetFollowUpDatePreset(14)}>
                  +2 Weeks
                </button>
                <button type="button" className="jd-preset-pill" onClick={() => handleSetFollowUpDatePreset(30)}>
                  +1 Month
                </button>
                <button type="button" className="jd-preset-pill clear" onClick={() => handleSetFollowUpDatePreset(null)}>
                  ✕ Clear Date
                </button>
              </div>
            </div>

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

            {/* Contact Details Quick-Edit */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                Contacts on File (Optional Update):
              </div>
              <div className="jd-form-row">
                <div className="jd-form-group">
                  <label>Decision Maker</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={followUpForm.decision_maker_name}
                    onChange={(e) => setFollowUpForm((prev) => ({ ...prev, decision_maker_name: e.target.value }))}
                  />
                </div>
                <div className="jd-form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={followUpForm.decision_maker_phone}
                    onChange={(e) => setFollowUpForm((prev) => ({ ...prev, decision_maker_phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="jd-form-row">
                <div className="jd-form-group">
                  <label>Inventory Keeper</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={followUpForm.inventory_keeper_name}
                    onChange={(e) => setFollowUpForm((prev) => ({ ...prev, inventory_keeper_name: e.target.value }))}
                  />
                </div>
                <div className="jd-form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    value={followUpForm.inventory_keeper_phone}
                    onChange={(e) => setFollowUpForm((prev) => ({ ...prev, inventory_keeper_phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="jd-form-row">
                <div className="jd-form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    placeholder="Contact Person"
                    value={followUpForm.contact_person}
                    onChange={(e) => setFollowUpForm((prev) => ({ ...prev, contact_person: e.target.value }))}
                  />
                </div>
                <div className="jd-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={followUpForm.contact_email}
                    onChange={(e) => setFollowUpForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                  />
                </div>
              </div>
            </div>
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
