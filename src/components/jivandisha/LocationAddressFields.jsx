import React from 'react'

export default function LocationAddressFields({ formData, setFormData }) {
  return (
    <>
      <div className="jd-form-grid-2">
        <div className="jd-form-row-h">
          <label>Street Address</label>
          <div className="jd-form-input-box">
            <input
              type="text"
              placeholder="e.g. 5th Main Road, Gandhi Nagar"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <div className="jd-form-row-h">
          <label>Email Address</label>
          <div className="jd-form-input-box">
            <input
              type="email"
              placeholder="info@bookstore.com"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="jd-form-grid-2">
        <div className="jd-form-row-h">
          <label>Coordinates *</label>
          <div className="jd-form-input-box">
            <input
              type="number"
              step="any"
              required
              placeholder="Lat"
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              title="Latitude"
            />
            <input
              type="number"
              step="any"
              required
              placeholder="Lng"
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              title="Longitude"
            />
          </div>
        </div>
      </div>

      <div className="jd-form-row-h top-align">
        <label>Business Notes</label>
        <div className="jd-form-input-box">
          <textarea
            placeholder="Tracking number, shipment courier, distributor terms, manager notes, etc."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>
    </>
  )
}
