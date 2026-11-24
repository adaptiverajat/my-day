import React from 'react'

export default function FollowUpContactInputs({ followUpForm, setFollowUpForm }) {
  const updateField = (field, value) => {
    setFollowUpForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
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
            onChange={(e) => updateField('decision_maker_name', e.target.value)}
          />
        </div>
        <div className="jd-form-group">
          <label>Phone</label>
          <input
            type="text"
            placeholder="Phone"
            value={followUpForm.decision_maker_phone}
            onChange={(e) => updateField('decision_maker_phone', e.target.value)}
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
            onChange={(e) => updateField('inventory_keeper_name', e.target.value)}
          />
        </div>
        <div className="jd-form-group">
          <label>Phone</label>
          <input
            type="text"
            placeholder="Phone"
            value={followUpForm.inventory_keeper_phone}
            onChange={(e) => updateField('inventory_keeper_phone', e.target.value)}
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
            onChange={(e) => updateField('contact_person', e.target.value)}
          />
        </div>
        <div className="jd-form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Email"
            value={followUpForm.contact_email}
            onChange={(e) => updateField('contact_email', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
