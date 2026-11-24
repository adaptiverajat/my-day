import React from 'react'
import MergeValuesForm from './MergeValuesForm'

export default function ContactMergeModal({
  showContactMergeModal,
  setShowContactMergeModal,
  selectedContactsForMerge,
  primaryContactId,
  handleSwitchPrimaryContact,
  mergeContactForm,
  setMergeContactForm,
  handleConfirmMergeContacts,
  isMergingContacts,
  getInvoicesCountForContact
}) {
  if (!showContactMergeModal || selectedContactsForMerge.length !== 2) return null

  const [locA, locB] = selectedContactsForMerge
  const isA = primaryContactId === locA.id
  const primary = isA ? locA : locB
  const duplicate = isA ? locB : locA
  const invCountA = getInvoicesCountForContact(locA.id)
  const invCountB = getInvoicesCountForContact(locB.id)

  const renderRecordCard = (loc, isPrimary, count) => (
    <div
      className={`jd-merge-record-card ${isPrimary ? 'is-primary' : 'is-duplicate'}`}
      onClick={() => handleSwitchPrimaryContact(loc.id)}
    >
      <div className="jd-merge-record-header">
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}>
          <input
            type="radio"
            name="primary_contact_choice"
            checked={isPrimary}
            onChange={() => handleSwitchPrimaryContact(loc.id)}
          />
          {loc.country === 'US' ? '🇺🇸' : '🇮🇳'} {loc.title}
        </label>
        <span className={`jd-merge-role-badge ${isPrimary ? 'keep' : 'delete'}`}>
          {isPrimary ? '✓ Primary (Keep)' : '⚠️ Duplicate (Delete)'}
        </span>
      </div>
      <div className="jd-merge-card-details">
        <div className="jd-merge-card-row"><span>City & State:</span><span>{[loc.city, loc.state].filter(Boolean).join(', ') || '—'}</span></div>
        <div className="jd-merge-card-row"><span>Address:</span><span>{loc.address || '—'}</span></div>
        <div className="jd-merge-card-row"><span>Decision Maker:</span><span>{loc.decision_maker_name ? `${loc.decision_maker_name} (${loc.decision_maker_phone || 'no phone'})` : '—'}</span></div>
        <div className="jd-merge-card-row"><span>Inventory Keeper:</span><span>{loc.inventory_keeper_name ? `${loc.inventory_keeper_name} (${loc.inventory_keeper_phone || 'no phone'})` : '—'}</span></div>
        <div className="jd-merge-card-row"><span>Contact Person:</span><span>{loc.contact_person || loc.contact_email || '—'}</span></div>
        <div className="jd-merge-card-row"><span>Follow-Up Date:</span><span>{loc.next_follow_up_date || 'None scheduled'}</span></div>
        <div className="jd-merge-card-row"><span>Invoices in DB:</span><span>📄 {count} invoice(s)</span></div>
        <div className="jd-merge-card-row"><span>Remarks:</span><span>{loc.remarks || loc.notes || '—'}</span></div>
      </div>
    </div>
  )

  return (
    <div className="jd-modal-overlay" onClick={() => setShowContactMergeModal(false)}>
      <div className="jd-modal-card jd-merge-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: '840px', width: '95%' }}>
        <div className="jd-modal-header" style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔀</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#5b21b6', fontWeight: 700 }}>Merge 2 Duplicate Contacts / Centers</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#6d28d9' }}>
                Choose which contact to keep as primary. All invoices will be re-linked, and the duplicate will be deleted.
              </p>
            </div>
          </div>
          <button type="button" className="jd-modal-close" onClick={() => setShowContactMergeModal(false)} title="Close modal">✕</button>
        </div>

        <div className="jd-merge-modal-content">
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              1. Select the Primary Contact Record to Keep (click to select):
            </div>
            <div className="jd-merge-records-grid">
              {renderRecordCard(locA, isA, invCountA)}
              {renderRecordCard(locB, !isA, invCountB)}
            </div>
          </div>

          <MergeValuesForm
            mergeContactForm={mergeContactForm}
            setMergeContactForm={setMergeContactForm}
            locA={locA}
            locB={locB}
          />

          <div className="jd-merge-warning-banner">
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong>Automatic Invoices Re-assignment & DB Deletion:</strong> Clicking <em>Confirm & Merge Contacts</em> will keep Primary Record <strong>{primary.title}</strong> (ID #{primary.id}), automatically re-link all <strong>{invCountB} past invoice(s)</strong> from Duplicate Record <strong>{duplicate.title}</strong> to Primary, and permanently delete Duplicate Record #{duplicate.id} from the database.
            </div>
          </div>
        </div>

        <div className="jd-modal-footer" style={{ justifyContent: 'space-between', background: '#f8fafc', padding: '12px 20px' }}>
          <button type="button" className="jd-btn" onClick={() => setShowContactMergeModal(false)} disabled={isMergingContacts}>✕ Cancel</button>
          <button type="button" className="jd-btn primary jd-btn-merge-action" onClick={handleConfirmMergeContacts} disabled={isMergingContacts} style={{ padding: '8px 20px', fontSize: '0.86rem' }}>
            {isMergingContacts ? 'Merging Contacts...' : '🔀 Confirm & Merge Contacts (Delete Duplicate)'}
          </button>
        </div>
      </div>
    </div>
  )
}
