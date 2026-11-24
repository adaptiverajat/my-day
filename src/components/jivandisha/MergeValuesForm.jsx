import React from 'react'

export default function MergeValuesForm({ mergeContactForm, setMergeContactForm, locA, locB }) {
  const updateField = (field, val) => setMergeContactForm((prev) => ({ ...prev, [field]: val }))

  const renderQuickButtons = (field, labelA, valA, labelB, valB) => (
    <div className="jd-merge-quick-options">
      {valA && <button type="button" className="jd-merge-quick-btn" onClick={() => updateField(field, valA)}>{labelA || valA}</button>}
      {valB && <button type="button" className="jd-merge-quick-btn" onClick={() => updateField(field, valB)}>{labelB || valB}</button>}
    </div>
  )

  return (
    <div className="jd-merge-preview-section">
      <div className="jd-merge-preview-title">
        <span>✏️</span>
        <span>2. Review & Customize Consolidated Contact Values:</span>
      </div>

      <div className="jd-merge-preview-grid">
        <div className="jd-merge-field-group">
          <label>Center / Location Title</label>
          <input type="text" className="jd-merge-field-input" value={mergeContactForm.title} onChange={(e) => updateField('title', e.target.value)} />
          {renderQuickButtons('title', `Use "${locA.title}"`, locA.title, `Use "${locB.title}"`, locB.title)}
        </div>

        <div className="jd-merge-field-group">
          <label>City</label>
          <input type="text" className="jd-merge-field-input" value={mergeContactForm.city} onChange={(e) => updateField('city', e.target.value)} />
          {renderQuickButtons('city', locA.city, locA.city, locB.city, locB.city)}
        </div>

        <div className="jd-merge-field-group">
          <label>State</label>
          <input type="text" className="jd-merge-field-input" value={mergeContactForm.state} onChange={(e) => updateField('state', e.target.value)} />
          {renderQuickButtons('state', locA.state, locA.state, locB.state, locB.state)}
        </div>

        <div className="jd-merge-field-group">
          <label>Address</label>
          <input type="text" className="jd-merge-field-input" value={mergeContactForm.address} onChange={(e) => updateField('address', e.target.value)} />
          {renderQuickButtons('address', 'Address from A', locA.address, 'Address from B', locB.address)}
        </div>

        <div className="jd-merge-field-group">
          <label>Decision Maker Name & Phone</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="text" className="jd-merge-field-input" placeholder="Name" value={mergeContactForm.decision_maker_name} onChange={(e) => updateField('decision_maker_name', e.target.value)} />
            <input type="text" className="jd-merge-field-input" placeholder="Phone" value={mergeContactForm.decision_maker_phone} onChange={(e) => updateField('decision_maker_phone', e.target.value)} />
          </div>
        </div>

        <div className="jd-merge-field-group">
          <label>Inventory Keeper Name & Phone</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="text" className="jd-merge-field-input" placeholder="Name" value={mergeContactForm.inventory_keeper_name} onChange={(e) => updateField('inventory_keeper_name', e.target.value)} />
            <input type="text" className="jd-merge-field-input" placeholder="Phone" value={mergeContactForm.inventory_keeper_phone} onChange={(e) => updateField('inventory_keeper_phone', e.target.value)} />
          </div>
        </div>

        <div className="jd-merge-field-group">
          <label>Contact Person & Email</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input type="text" className="jd-merge-field-input" placeholder="Contact Person" value={mergeContactForm.contact_person} onChange={(e) => updateField('contact_person', e.target.value)} />
            <input type="email" className="jd-merge-field-input" placeholder="Email" value={mergeContactForm.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} />
          </div>
        </div>

        <div className="jd-merge-field-group">
          <label>Next Follow-Up Date</label>
          <input type="date" className="jd-merge-field-input" value={mergeContactForm.next_follow_up_date || ''} onChange={(e) => updateField('next_follow_up_date', e.target.value)} />
        </div>
      </div>

      <div className="jd-merge-field-group">
        <label>Remarks & Follow-Up Notes</label>
        <textarea className="jd-merge-field-textarea" value={mergeContactForm.remarks} onChange={(e) => updateField('remarks', e.target.value)} placeholder="Consolidated remarks..." />
      </div>
    </div>
  )
}
