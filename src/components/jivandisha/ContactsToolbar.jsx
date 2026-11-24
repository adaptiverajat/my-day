import React from 'react'

export default function ContactsToolbar({
  contactSearchTerm,
  setContactSearchTerm,
  contactFilterFollowUp,
  setContactFilterFollowUp,
  contactFilterCountry,
  setContactFilterCountry,
  contactSortBy,
  setContactSortBy,
  contactsDueTodayCount,
  contactsOverdueCount,
  contactsUpcomingCount,
  contactsNoDateCount,
  filteredContactsCount,
  selectedContactIds,
  setSelectedContactIds,
  handleOpenContactMergeModal
}) {
  return (
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
          ({filteredContactsCount} contacts)
        </span>

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
  )
}
