import React from 'react'

export default function LocationContactFields({ formData, setFormData }) {
  return (
    <div className="jd-contacts-section">
      <div className="jd-form-row-h">
        <label>👔 Decision Maker</label>
        <div className="jd-form-input-box">
          <input
            type="text"
            placeholder="Name (e.g. Ramesh Sharma)"
            value={formData.decision_maker_name}
            onChange={(e) =>
              setFormData({ ...formData, decision_maker_name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Phone (e.g. +91 98765 12345)"
            value={formData.decision_maker_phone}
            onChange={(e) =>
              setFormData({ ...formData, decision_maker_phone: e.target.value })
            }
          />
        </div>
      </div>

      <div className="jd-form-row-h">
        <label>📦 Inventory Keeper</label>
        <div className="jd-form-input-box">
          <input
            type="text"
            placeholder="Name (e.g. Suresh Patel)"
            value={formData.inventory_keeper_name}
            onChange={(e) =>
              setFormData({ ...formData, inventory_keeper_name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Phone (e.g. +91 98765 67890)"
            value={formData.inventory_keeper_phone}
            onChange={(e) =>
              setFormData({ ...formData, inventory_keeper_phone: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  )
}
