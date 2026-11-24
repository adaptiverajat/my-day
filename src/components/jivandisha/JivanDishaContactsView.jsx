import React, { useState, useMemo } from 'react'
import { getFollowUpStatusInfo, API_BASE_URL } from './jivandishaHelpers'

export default function JivanDishaContactsView({
  mainTab,
  locations = [],
  allInvoices = [],
  loadLocations,
  loadAllInvoices,
  contactsDueTodayCount,
  contactsOverdueCount,
  contactsUpcomingCount,
  contactsNoDateCount,
  contactSearchTerm,
  setContactSearchTerm,
  contactFilterFollowUp,
  setContactFilterFollowUp,
  contactFilterCountry,
  setContactFilterCountry,
  contactSortBy,
  setContactSortBy,
  filteredContacts = [],
  handleOpenFollowUpModal,
  handleOpenEdit
}) {
  // Merge Duplicate Contacts State
  const [selectedContactIds, setSelectedContactIds] = useState([])
  const [showContactMergeModal, setShowContactMergeModal] = useState(false)
  const [primaryContactId, setPrimaryContactId] = useState(null)
  const [isMergingContacts, setIsMergingContacts] = useState(false)
  const [mergeContactForm, setMergeContactForm] = useState({
    country: 'IN',
    title: '',
    category: 'General',
    city: '',
    state: '',
    address: '',
    notes: '',
    decision_maker_name: '',
    decision_maker_phone: '',
    inventory_keeper_name: '',
    inventory_keeper_phone: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    next_follow_up_date: '',
    remarks: ''
  })

  // Toggle selection for merging contacts (maximum 2 at a time)
  const handleToggleSelectContact = (id) => {
    setSelectedContactIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= 2) {
        // If 2 are already selected, replace the second one
        return [prev[0], id]
      }
      return [...prev, id]
    })
  }

  // Get the 2 contact objects selected for merge
  const selectedContactsForMerge = useMemo(() => {
    return selectedContactIds
      .map((id) => (locations || []).find((l) => l.id === id))
      .filter(Boolean)
  }, [selectedContactIds, locations])

  // Count past invoices attached to a center
  const getInvoicesCountForContact = (locId) => {
    return (allInvoices || []).filter((inv) => inv.location_id === locId).length
  }

  const handleOpenContactMergeModal = () => {
    if (selectedContactsForMerge.length !== 2) {
      alert('Please select exactly 2 contacts / centers to merge.')
      return
    }
    const [locA, locB] = selectedContactsForMerge
    // Default primary to the first selected contact
    setPrimaryContactId(locA.id)
    setMergeContactForm({
      country: locA.country || locB.country || 'IN',
      title: locA.title || locB.title || '',
      category: locA.category || locB.category || 'General',
      city: locA.city || locB.city || '',
      state: locA.state || locB.state || '',
      address: locA.address || locB.address || '',
      decision_maker_name: locA.decision_maker_name || locB.decision_maker_name || '',
      decision_maker_phone: locA.decision_maker_phone || locB.decision_maker_phone || '',
      inventory_keeper_name: locA.inventory_keeper_name || locB.inventory_keeper_name || '',
      inventory_keeper_phone: locA.inventory_keeper_phone || locB.inventory_keeper_phone || '',
      contact_person: locA.contact_person || locB.contact_person || '',
      contact_phone: locA.contact_phone || locB.contact_phone || '',
      contact_email: locA.contact_email || locB.contact_email || '',
      website: locA.website || locB.website || '',
      next_follow_up_date: locA.next_follow_up_date || locB.next_follow_up_date || '',
      remarks: [locA.remarks, locB.remarks].filter(Boolean).join(' | '),
      notes: [locA.notes, locB.notes].filter(Boolean).join(' | ')
    })
    setShowContactMergeModal(true)
  }

  const handleSwitchPrimaryContact = (newPrimaryId) => {
    setPrimaryContactId(newPrimaryId)
    const newPrimary = selectedContactsForMerge.find((l) => l.id === newPrimaryId)
    const newDup = selectedContactsForMerge.find((l) => l.id !== newPrimaryId)
    if (newPrimary && newDup) {
      setMergeContactForm((prev) => ({
        ...prev,
        title: prev.title || newPrimary.title || newDup.title,
        city: prev.city || newPrimary.city || newDup.city,
        state: prev.state || newPrimary.state || newDup.state,
        address: prev.address || newPrimary.address || newDup.address
      }))
    }
  }

  const handleConfirmMergeContacts = async () => {
    if (!primaryContactId) return
    const dupLoc = selectedContactsForMerge.find((l) => l.id !== primaryContactId)
    if (!dupLoc) return

    setIsMergingContacts(true)
    try {
      const payload = {
        primary_id: primaryContactId,
        duplicate_id: dupLoc.id,
        merged_fields: {
          country: mergeContactForm.country,
          title: mergeContactForm.title || '',
          category: mergeContactForm.category || 'General',
          city: mergeContactForm.city || '',
          state: mergeContactForm.state || '',
          address: mergeContactForm.address || '',
          decision_maker_name: mergeContactForm.decision_maker_name || '',
          decision_maker_phone: mergeContactForm.decision_maker_phone || '',
          inventory_keeper_name: mergeContactForm.inventory_keeper_name || '',
          inventory_keeper_phone: mergeContactForm.inventory_keeper_phone || '',
          contact_person: mergeContactForm.contact_person || '',
          contact_phone: mergeContactForm.contact_phone || '',
          contact_email: mergeContactForm.contact_email || '',
          website: mergeContactForm.website || '',
          next_follow_up_date: mergeContactForm.next_follow_up_date || null,
          remarks: mergeContactForm.remarks || '',
          notes: mergeContactForm.notes || ''
        }
      }

      const res = await fetch(`${API_BASE_URL}/locations/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (loadLocations) await loadLocations()
        if (loadAllInvoices) await loadAllInvoices()

        setShowContactMergeModal(false)
        setSelectedContactIds([])
        alert(
          `🎉 Contacts merged successfully into single record "${mergeContactForm.title || primaryContactId}"! Duplicate contact "${dupLoc.title}" was permanently removed from the database and all its past invoices were smoothly re-linked.`
        )
      } else {
        alert(data.message || 'Failed to merge contacts.')
      }
    } catch (err) {
      console.error('Error merging contacts:', err)
      alert('Error merging contacts: ' + err.message)
    } finally {
      setIsMergingContacts(false)
    }
  }
  return (
    <div className="jd-contacts-view" style={{ display: mainTab === 'contacts' ? 'flex' : 'none' }}>
      {/* KPI Summary Cards */}
      <div className="jd-kpi-grid">
        <div className="jd-kpi-card blue">
          <div className="jd-kpi-icon-wrap">👥</div>
          <div className="jd-kpi-content">
            <span className="jd-kpi-title">Total Contacts / Centers</span>
            <span className="jd-kpi-value">{locations.length}</span>
            <span className="jd-kpi-sub">Active operations points</span>
          </div>
        </div>
        <div className="jd-kpi-card amber">
          <div className="jd-kpi-icon-wrap">🔔</div>
          <div className="jd-kpi-content">
            <span className="jd-kpi-title">Due Today</span>
            <span className="jd-kpi-value">{contactsDueTodayCount}</span>
            <span className="jd-kpi-sub">Needs immediate contact</span>
          </div>
        </div>
        <div className="jd-kpi-card rose">
          <div className="jd-kpi-icon-wrap">⚠️</div>
          <div className="jd-kpi-content">
            <span className="jd-kpi-title">Overdue Follow-ups</span>
            <span className="jd-kpi-value">{contactsOverdueCount}</span>
            <span className="jd-kpi-sub">Pending past scheduled date</span>
          </div>
        </div>
        <div className="jd-kpi-card emerald">
          <div className="jd-kpi-icon-wrap">📅</div>
          <div className="jd-kpi-content">
            <span className="jd-kpi-title">Upcoming</span>
            <span className="jd-kpi-value">{contactsUpcomingCount}</span>
            <span className="jd-kpi-sub">Scheduled future calls</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="jd-view-toolbar">
        <div className="jd-toolbar-search-wrap">
          <input
            type="text"
            className="jd-toolbar-search-input"
            placeholder="🔍 Search contacts by name, location, city, phone, email, remarks..."
            value={contactSearchTerm}
            onChange={(e) => setContactSearchTerm(e.target.value)}
          />
        </div>

        <div className="jd-toolbar-filters">
          <select
            className="jd-toolbar-select"
            value={contactFilterFollowUp}
            onChange={(e) => setContactFilterFollowUp(e.target.value)}
          >
            <option value="ALL">All Follow-ups</option>
            <option value="TODAY">🔔 Due Today ({contactsDueTodayCount})</option>
            <option value="OVERDUE">⚠️ Overdue ({contactsOverdueCount})</option>
            <option value="UPCOMING">📅 Upcoming ({contactsUpcomingCount})</option>
            <option value="NONE">⚪ Not Scheduled ({contactsNoDateCount})</option>
          </select>

          <select
            className="jd-toolbar-select"
            value={contactFilterCountry}
            onChange={(e) => setContactFilterCountry(e.target.value)}
          >
            <option value="ALL">All Countries</option>
            <option value="IN">🇮🇳 India</option>
            <option value="US">🇺🇸 USA</option>
          </select>

          <select
            className="jd-toolbar-select"
            value={contactSortBy}
            onChange={(e) => setContactSortBy(e.target.value)}
          >
            <option value="followup-asc">📅 Follow-Up: Earliest First</option>
            <option value="followup-desc">📅 Follow-Up: Furthest First</option>
            <option value="title-asc">🔤 Location: A to Z</option>
            <option value="city-asc">📍 City: A to Z</option>
          </select>

          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            ({filteredContacts.length} contacts)
          </span>

          {/* Merge Duplicates Action Pill */}
          {selectedContactIds.length > 0 && (
            <div className="jd-merge-toolbar-pill">
              <span className="jd-merge-count-badge">
                {selectedContactIds.length}/2 Selected
              </span>
              {selectedContactIds.length === 2 ? (
                <button
                  type="button"
                  className="jd-btn primary jd-btn-merge-action"
                  onClick={handleOpenContactMergeModal}
                  title="Merge the 2 selected contacts into a single record"
                >
                  🔀 Merge 2 Contacts
                </button>
              ) : (
                <span className="jd-merge-instruction">
                  Select 1 more duplicate contact
                </span>
              )}
              <button
                type="button"
                className="jd-btn"
                onClick={() => setSelectedContactIds([])}
                style={{ fontSize: '0.74rem', padding: '3px 7px' }}
                title="Cancel selection"
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contacts Tabular Table */}
      <div className="jd-table-card">
        <div className="jd-table-scroll-wrap">
          <table className="jd-tabular-table">
            <thead>
              <tr>
                <th style={{ width: '44px', textAlign: 'center' }}>
                  {selectedContactIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedContactIds([])}
                      title="Clear selection"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b' }}
                    >
                      ✕
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Merge</span>
                  )}
                </th>
                <th style={{ width: '36px' }}>#</th>
                <th>Location / Center</th>
                <th>City & State</th>
                <th>Decision Maker</th>
                <th>Inventory Keeper</th>
                <th>Contact Person / Email</th>
                <th>Next Follow-Up Date</th>
                <th>Remarks / Follow-up Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No contacts match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((loc, idx) => {
                  const fuInfo = getFollowUpStatusInfo(loc.next_follow_up_date)
                  const isSelected = selectedContactIds.includes(loc.id)
                  return (
                    <tr
                      key={loc.id || idx}
                      className={isSelected ? 'jd-row-selected' : ''}
                    >
                      {/* Merge selection checkbox */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectContact(loc.id)}
                          title={
                            isSelected
                              ? 'Selected for merge (click to uncheck)'
                              : selectedContactIds.length >= 2
                              ? '2 already selected. Clicking replaces the second.'
                              : 'Select to merge duplicates'
                          }
                        />
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{idx + 1}</td>
                      <td>
                        <div className="jd-table-loc-title">
                          {loc.country === 'US' ? '🇺🇸' : '🇮🇳'} {loc.title}
                        </div>
                        {loc.address && <span className="jd-table-sub">{loc.address}</span>}
                      </td>
                      <td>
                        <strong>{[loc.city, loc.state].filter(Boolean).join(', ') || '—'}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loc.decision_maker_name || '—'}</div>
                        {loc.decision_maker_phone && (
                          <span className="jd-table-sub">📞 {loc.decision_maker_phone}</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loc.inventory_keeper_name || '—'}</div>
                        {loc.inventory_keeper_phone && (
                          <span className="jd-table-sub">📞 {loc.inventory_keeper_phone}</span>
                        )}
                      </td>
                      <td>
                        {loc.contact_person && <div>👤 {loc.contact_person}</div>}
                        {loc.contact_email ? (
                          <a href={`mailto:${loc.contact_email}`} className="jd-table-sub">
                            ✉️ {loc.contact_email}
                          </a>
                        ) : (
                          !loc.contact_person && '—'
                        )}
                      </td>
                      <td>
                        <span className={`jd-fu-badge ${fuInfo.className}`}>{fuInfo.label}</span>
                      </td>
                      <td>
                        <div className="jd-table-remarks">{loc.remarks || '—'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="jd-btn primary"
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                            onClick={() => handleOpenFollowUpModal(loc)}
                            title="Set next follow-up date and remarks"
                          >
                            📅 Follow-Up
                          </button>
                          <button
                            type="button"
                            className="jd-btn"
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                            onClick={() => handleOpenEdit(loc)}
                            title="Edit location details"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merge Duplicate Contacts Modal */}
      {showContactMergeModal && selectedContactsForMerge.length === 2 && (() => {
        const [locA, locB] = selectedContactsForMerge
        const isA = primaryContactId === locA.id
        const primary = isA ? locA : locB
        const duplicate = isA ? locB : locA
        const invCountA = getInvoicesCountForContact(locA.id)
        const invCountB = getInvoicesCountForContact(locB.id)

        return (
          <div className="jd-modal-overlay" onClick={() => setShowContactMergeModal(false)}>
            <div
              className="jd-modal-card jd-merge-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{ maxWidth: '840px', width: '95%' }}
            >
              <div className="jd-modal-header" style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🔀</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#5b21b6', fontWeight: 700 }}>
                      Merge 2 Duplicate Contacts / Centers
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#6d28d9' }}>
                      Choose which contact to keep as primary. All invoices from the duplicate will be automatically re-linked to the primary contact, and the duplicate will be deleted from the database.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="jd-modal-close"
                  onClick={() => setShowContactMergeModal(false)}
                  title="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="jd-merge-modal-content">
                {/* 1. Comparison & Primary Selection */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    1. Select the Primary Contact Record to Keep (click to select):
                  </div>
                  <div className="jd-merge-records-grid">
                    {/* Record A */}
                    <div
                      className={`jd-merge-record-card ${isA ? 'is-primary' : 'is-duplicate'}`}
                      onClick={() => handleSwitchPrimaryContact(locA.id)}
                    >
                      <div className="jd-merge-record-header">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}>
                          <input
                            type="radio"
                            name="primary_contact_choice"
                            checked={isA}
                            onChange={() => handleSwitchPrimaryContact(locA.id)}
                          />
                          {locA.country === 'US' ? '🇺🇸' : '🇮🇳'} {locA.title}
                        </label>
                        <span className={`jd-merge-role-badge ${isA ? 'keep' : 'delete'}`}>
                          {isA ? '✓ Primary (Keep)' : '⚠️ Duplicate (Delete)'}
                        </span>
                      </div>
                      <div className="jd-merge-card-details">
                        <div className="jd-merge-card-row">
                          <span>City & State:</span>
                          <span>{[locA.city, locA.state].filter(Boolean).join(', ') || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Address:</span>
                          <span>{locA.address || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Decision Maker:</span>
                          <span>{locA.decision_maker_name ? `${locA.decision_maker_name} (${locA.decision_maker_phone || 'no phone'})` : '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Inventory Keeper:</span>
                          <span>{locA.inventory_keeper_name ? `${locA.inventory_keeper_name} (${locA.inventory_keeper_phone || 'no phone'})` : '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Contact Person:</span>
                          <span>{locA.contact_person || locA.contact_email || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Follow-Up Date:</span>
                          <span>{locA.next_follow_up_date || 'None scheduled'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Invoices in DB:</span>
                          <span>📄 {invCountA} invoice(s)</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Remarks:</span>
                          <span>{locA.remarks || locA.notes || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Record B */}
                    <div
                      className={`jd-merge-record-card ${!isA ? 'is-primary' : 'is-duplicate'}`}
                      onClick={() => handleSwitchPrimaryContact(locB.id)}
                    >
                      <div className="jd-merge-record-header">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}>
                          <input
                            type="radio"
                            name="primary_contact_choice"
                            checked={!isA}
                            onChange={() => handleSwitchPrimaryContact(locB.id)}
                          />
                          {locB.country === 'US' ? '🇺🇸' : '🇮🇳'} {locB.title}
                        </label>
                        <span className={`jd-merge-role-badge ${!isA ? 'keep' : 'delete'}`}>
                          {!isA ? '✓ Primary (Keep)' : '⚠️ Duplicate (Delete)'}
                        </span>
                      </div>
                      <div className="jd-merge-card-details">
                        <div className="jd-merge-card-row">
                          <span>City & State:</span>
                          <span>{[locB.city, locB.state].filter(Boolean).join(', ') || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Address:</span>
                          <span>{locB.address || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Decision Maker:</span>
                          <span>{locB.decision_maker_name ? `${locB.decision_maker_name} (${locB.decision_maker_phone || 'no phone'})` : '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Inventory Keeper:</span>
                          <span>{locB.inventory_keeper_name ? `${locB.inventory_keeper_name} (${locB.inventory_keeper_phone || 'no phone'})` : '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Contact Person:</span>
                          <span>{locB.contact_person || locB.contact_email || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Follow-Up Date:</span>
                          <span>{locB.next_follow_up_date || 'None scheduled'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Invoices in DB:</span>
                          <span>📄 {invCountB} invoice(s)</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Remarks:</span>
                          <span>{locB.remarks || locB.notes || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Consolidated Values Preview & Quick Controls */}
                <div className="jd-merge-preview-section">
                  <div className="jd-merge-preview-title">
                    <span>✏️</span>
                    <span>2. Review & Customize Consolidated Contact Values:</span>
                  </div>

                  <div className="jd-merge-preview-grid">
                    {/* Location Title */}
                    <div className="jd-merge-field-group">
                      <label>Center / Location Title</label>
                      <input
                        type="text"
                        className="jd-merge-field-input"
                        value={mergeContactForm.title}
                        onChange={(e) => setMergeContactForm({ ...mergeContactForm, title: e.target.value })}
                      />
                      <div className="jd-merge-quick-options">
                        <button
                          type="button"
                          className="jd-merge-quick-btn"
                          onClick={() => setMergeContactForm({ ...mergeContactForm, title: locA.title })}
                        >
                          Use "{locA.title}"
                        </button>
                        <button
                          type="button"
                          className="jd-merge-quick-btn"
                          onClick={() => setMergeContactForm({ ...mergeContactForm, title: locB.title })}
                        >
                          Use "{locB.title}"
                        </button>
                      </div>
                    </div>

                    {/* City */}
                    <div className="jd-merge-field-group">
                      <label>City</label>
                      <input
                        type="text"
                        className="jd-merge-field-input"
                        value={mergeContactForm.city}
                        onChange={(e) => setMergeContactForm({ ...mergeContactForm, city: e.target.value })}
                      />
                      <div className="jd-merge-quick-options">
                        {locA.city && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeContactForm({ ...mergeContactForm, city: locA.city })}
                          >
                            {locA.city}
                          </button>
                        )}
                        {locB.city && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeContactForm({ ...mergeContactForm, city: locB.city })}
                          >
                            {locB.city}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* State */}
                    <div className="jd-merge-field-group">
                      <label>State</label>
                      <input
                        type="text"
                        className="jd-merge-field-input"
                        value={mergeContactForm.state}
                        onChange={(e) => setMergeContactForm({ ...mergeContactForm, state: e.target.value })}
                      />
                      <div className="jd-merge-quick-options">
                        {locA.state && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeContactForm({ ...mergeContactForm, state: locA.state })}
                          >
                            {locA.state}
                          </button>
                        )}
                        {locB.state && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeContactForm({ ...mergeContactForm, state: locB.state })}
                          >
                            {locB.state}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="jd-merge-field-group">
                      <label>Address</label>
                      <input
                        type="text"
                        className="jd-merge-field-input"
                        value={mergeContactForm.address}
                        onChange={(e) => setMergeContactForm({ ...mergeContactForm, address: e.target.value })}
                      />
                      <div className="jd-merge-quick-options">
                        {locA.address && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeContactForm({ ...mergeContactForm, address: locA.address })}
                          >
                            Address from A
                          </button>
                        )}
                        {locB.address && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeContactForm({ ...mergeContactForm, address: locB.address })}
                          >
                            Address from B
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Decision Maker */}
                    <div className="jd-merge-field-group">
                      <label>Decision Maker Name & Phone</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="jd-merge-field-input"
                          placeholder="Name"
                          value={mergeContactForm.decision_maker_name}
                          onChange={(e) => setMergeContactForm({ ...mergeContactForm, decision_maker_name: e.target.value })}
                        />
                        <input
                          type="text"
                          className="jd-merge-field-input"
                          placeholder="Phone"
                          value={mergeContactForm.decision_maker_phone}
                          onChange={(e) => setMergeContactForm({ ...mergeContactForm, decision_maker_phone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Inventory Keeper */}
                    <div className="jd-merge-field-group">
                      <label>Inventory Keeper Name & Phone</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="jd-merge-field-input"
                          placeholder="Name"
                          value={mergeContactForm.inventory_keeper_name}
                          onChange={(e) => setMergeContactForm({ ...mergeContactForm, inventory_keeper_name: e.target.value })}
                        />
                        <input
                          type="text"
                          className="jd-merge-field-input"
                          placeholder="Phone"
                          value={mergeContactForm.inventory_keeper_phone}
                          onChange={(e) => setMergeContactForm({ ...mergeContactForm, inventory_keeper_phone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Contact Person & Email */}
                    <div className="jd-merge-field-group">
                      <label>Contact Person & Email</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="jd-merge-field-input"
                          placeholder="Contact Person"
                          value={mergeContactForm.contact_person}
                          onChange={(e) => setMergeContactForm({ ...mergeContactForm, contact_person: e.target.value })}
                        />
                        <input
                          type="email"
                          className="jd-merge-field-input"
                          placeholder="Email"
                          value={mergeContactForm.contact_email}
                          onChange={(e) => setMergeContactForm({ ...mergeContactForm, contact_email: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Next Follow-Up Date */}
                    <div className="jd-merge-field-group">
                      <label>Next Follow-Up Date</label>
                      <input
                        type="date"
                        className="jd-merge-field-input"
                        value={mergeContactForm.next_follow_up_date || ''}
                        onChange={(e) => setMergeContactForm({ ...mergeContactForm, next_follow_up_date: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Remarks & Notes */}
                  <div className="jd-merge-field-group">
                    <label>Remarks & Follow-Up Notes</label>
                    <textarea
                      className="jd-merge-field-textarea"
                      value={mergeContactForm.remarks}
                      onChange={(e) => setMergeContactForm({ ...mergeContactForm, remarks: e.target.value })}
                      placeholder="Consolidated remarks..."
                    />
                  </div>
                </div>

                {/* 3. Re-link Invoices & Warning Banner */}
                <div className="jd-merge-warning-banner">
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <div>
                    <strong>Automatic Invoices Re-assignment & DB Deletion:</strong> Clicking <em>Confirm & Merge Contacts</em> will keep Primary Record <strong>{primary.title}</strong> (ID #{primary.id}), automatically re-link all <strong>{invCountB} past invoice(s)</strong> from Duplicate Record <strong>{duplicate.title}</strong> to Primary, and permanently delete Duplicate Record #{duplicate.id} from the database.
                  </div>
                </div>
              </div>

              <div className="jd-modal-footer" style={{ justifyContent: 'space-between', background: '#f8fafc', padding: '12px 20px' }}>
                <button
                  type="button"
                  className="jd-btn"
                  onClick={() => setShowContactMergeModal(false)}
                  disabled={isMergingContacts}
                >
                  ✕ Cancel
                </button>

                <button
                  type="button"
                  className="jd-btn primary jd-btn-merge-action"
                  onClick={handleConfirmMergeContacts}
                  disabled={isMergingContacts}
                  style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                >
                  {isMergingContacts ? 'Merging Contacts...' : '🔀 Confirm & Merge Contacts (Delete Duplicate)'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
