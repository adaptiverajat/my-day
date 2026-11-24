import React from 'react'
import { useContactMerge } from './useContactMerge'
import ContactsKpiCards from './ContactsKpiCards'
import ContactsToolbar from './ContactsToolbar'
import ContactsTableRow from './ContactsTableRow'
import ContactMergeModal from './ContactMergeModal'

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
  const {
    selectedContactIds,
    setSelectedContactIds,
    showContactMergeModal,
    setShowContactMergeModal,
    primaryContactId,
    isMergingContacts,
    mergeContactForm,
    setMergeContactForm,
    handleToggleSelectContact,
    selectedContactsForMerge,
    getInvoicesCountForContact,
    handleOpenContactMergeModal,
    handleSwitchPrimaryContact,
    handleConfirmMergeContacts
  } = useContactMerge({ locations, allInvoices, loadLocations, loadAllInvoices })

  return (
    <div className="jd-contacts-view" style={{ display: mainTab === 'contacts' ? 'flex' : 'none' }}>
      <ContactsKpiCards
        totalLocationsCount={locations.length}
        contactsDueTodayCount={contactsDueTodayCount}
        contactsOverdueCount={contactsOverdueCount}
        contactsUpcomingCount={contactsUpcomingCount}
      />

      <ContactsToolbar
        contactSearchTerm={contactSearchTerm}
        setContactSearchTerm={setContactSearchTerm}
        contactFilterFollowUp={contactFilterFollowUp}
        setContactFilterFollowUp={setContactFilterFollowUp}
        contactFilterCountry={contactFilterCountry}
        setContactFilterCountry={setContactFilterCountry}
        contactSortBy={contactSortBy}
        setContactSortBy={setContactSortBy}
        contactsDueTodayCount={contactsDueTodayCount}
        contactsOverdueCount={contactsOverdueCount}
        contactsUpcomingCount={contactsUpcomingCount}
        contactsNoDateCount={contactsNoDateCount}
        filteredContactsCount={filteredContacts.length}
        selectedContactIds={selectedContactIds}
        setSelectedContactIds={setSelectedContactIds}
        handleOpenContactMergeModal={handleOpenContactMergeModal}
      />

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
                filteredContacts.map((loc, idx) => (
                  <ContactsTableRow
                    key={loc.id || idx}
                    loc={loc}
                    idx={idx}
                    isSelected={selectedContactIds.includes(loc.id)}
                    selectedCount={selectedContactIds.length}
                    onToggleSelect={handleToggleSelectContact}
                    onOpenFollowUp={handleOpenFollowUpModal}
                    onOpenEdit={handleOpenEdit}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContactMergeModal
        showContactMergeModal={showContactMergeModal}
        setShowContactMergeModal={setShowContactMergeModal}
        selectedContactsForMerge={selectedContactsForMerge}
        primaryContactId={primaryContactId}
        handleSwitchPrimaryContact={handleSwitchPrimaryContact}
        mergeContactForm={mergeContactForm}
        setMergeContactForm={setMergeContactForm}
        handleConfirmMergeContacts={handleConfirmMergeContacts}
        isMergingContacts={isMergingContacts}
        getInvoicesCountForContact={getInvoicesCountForContact}
      />
    </div>
  )
}
