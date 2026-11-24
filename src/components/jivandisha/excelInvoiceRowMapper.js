import {
  normalizeDate,
  normalizePayment,
  normalizeAmount,
  normalizeBooks,
  getSmartValue
} from './excelNormalization'
import {
  locationMatchers,
  invoiceNoMatchers,
  dateMatchers,
  booksMatchers,
  amountMatchers,
  paymentMatchers,
  contactMatchers,
  phoneMatchers,
  notesMatchers
} from './excelInvoiceMatchers'

function matchExistingLocation(locTitle, existingLocations) {
  if (!locTitle || !Array.isArray(existingLocations) || existingLocations.length === 0) return null
  const cleanLower = locTitle.toLowerCase()
  return (
    existingLocations.find((l) => l.title && l.title.trim().toLowerCase() === cleanLower) ||
    existingLocations.find((l) => l.title && (l.title.toLowerCase().includes(cleanLower) || cleanLower.includes(l.title.toLowerCase()))) ||
    null
  )
}

function resolveCountry(rawCountry, defaultCountry, matchedLoc) {
  if (rawCountry) {
    const cStr = String(rawCountry).trim().toUpperCase()
    if (cStr === 'US' || cStr === 'USA' || cStr.includes('UNITED STATES')) return 'US'
    if (cStr === 'IN' || cStr === 'IND' || cStr.includes('INDIA')) return 'IN'
  }
  return matchedLoc?.country || defaultCountry
}

export function mapRawRowToOrder(row, idx, defaultCountry = 'IN', existingLocations = []) {
  const rawLoc = getSmartValue(row, locationMatchers)
  const rawInvNo = getSmartValue(row, invoiceNoMatchers)
  const rawDate = getSmartValue(row, dateMatchers)
  const rawBooks = getSmartValue(row, booksMatchers)
  const rawAmount = getSmartValue(row, amountMatchers)
  const rawPayment = getSmartValue(row, paymentMatchers)
  const rawCity = getSmartValue(row, [(c) => c.includes('city') || c.includes('town') || c.includes('district')])
  const rawState = getSmartValue(row, [(c) => c.includes('state') || c.includes('province') || c === 'st'])
  const rawCountry = getSmartValue(row, [(c) => c.includes('country') || c.includes('nation')])
  const rawContact = getSmartValue(row, contactMatchers)
  const rawPhone = getSmartValue(row, phoneMatchers)
  const rawNotes = getSmartValue(row, notesMatchers)

  const invNo = String(rawInvNo).trim()
  const books = normalizeBooks(rawBooks)
  const amount = normalizeAmount(rawAmount)
  const isPaid = normalizePayment(rawPayment)
  const invoiceDate = normalizeDate(rawDate)

  let locTitle = String(rawLoc).trim()
  if (!locTitle) {
    const cityStr = String(rawCity).trim()
    if (cityStr) locTitle = `${cityStr} Center`
    else if (invNo) locTitle = `Order #${invNo}`
    else locTitle = `Order Entry ${idx + 1}`
  }

  const matchedLoc = matchExistingLocation(locTitle, existingLocations)
  const city = String(rawCity).trim() || matchedLoc?.city || ''
  const state = String(rawState).trim() || matchedLoc?.state || ''
  const resolvedCountry = resolveCountry(rawCountry, defaultCountry, matchedLoc)

  return {
    id: `row_${idx + 1}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    row_index: idx + 1,
    selected: true,
    location_id: matchedLoc ? String(matchedLoc.id) : '',
    location_title: matchedLoc ? matchedLoc.title : locTitle,
    is_matched_location: Boolean(matchedLoc),
    country: resolvedCountry,
    city,
    state,
    invoice_number: invNo,
    invoice_date: invoiceDate,
    books_sent: books,
    amount: amount,
    payment_received: isPaid,
    decision_maker_name: String(rawContact).trim() || matchedLoc?.decision_maker_name || '',
    decision_maker_phone: String(rawPhone).trim() || matchedLoc?.decision_maker_phone || '',
    notes: String(rawNotes).trim()
  }
}
