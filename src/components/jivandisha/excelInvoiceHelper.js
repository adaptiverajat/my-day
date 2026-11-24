import * as XLSX from 'xlsx'

/**
 * Normalizes fuzzy date inputs (Excel Date objects, Excel serial date codes, and string formats)
 */
function normalizeDate(rawDate) {
  if (!rawDate) return new Date().toISOString().slice(0, 10)

  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    const y = rawDate.getFullYear()
    const m = String(rawDate.getMonth() + 1).padStart(2, '0')
    const d = String(rawDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Excel numeric date code (e.g. 45240)
  if (typeof rawDate === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(rawDate)
      if (parsed) {
        const y = String(parsed.y).padStart(4, '0')
        const m = String(parsed.m).padStart(2, '0')
        const d = String(parsed.d).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
    } catch {
      // fallback
    }
  }

  const str = String(rawDate).trim()

  // Match ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10)
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  // Match MM/DD/YYYY
  const mdyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (mdyMatch) {
    const [, m, d, rawY] = mdyMatch
    const y = rawY.length === 2 ? `20${rawY}` : rawY
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  // Fallback to JS Date
  const parsedTs = Date.parse(str)
  if (!isNaN(parsedTs)) {
    const d = new Date(parsedTs)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return new Date().toISOString().slice(0, 10)
}

/**
 * Normalizes payment status from strings or booleans
 */
function normalizePayment(val) {
  if (typeof val === 'boolean') return val
  if (!val) return false

  const s = String(val).trim().toLowerCase()
  if (['paid', 'yes', 'true', 'done', 'received', 'cleared', '1', 'y', 'complete', 'completed'].includes(s)) {
    return true
  }
  return false
}

/**
 * Normalizes numerical amount
 */
function normalizeAmount(val) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  const cleaned = String(val).replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/**
 * Normalizes integer books quantity
 */
function normalizeBooks(val) {
  if (!val) return 0
  if (typeof val === 'number') return Math.max(0, Math.floor(val))
  const cleaned = String(val).replace(/[^0-9]/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

/**
 * Cleans string key to lower-case alphanumeric for resilient fuzzy matching
 */
function cleanKey(k) {
  return String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Finds a value from an object based on predicate functions testing cleaned key names
 */
function getSmartValue(row, matchers) {
  const keys = Object.keys(row)
  for (const matcher of matchers) {
    const foundKey = keys.find((k) => {
      const c = cleanKey(k)
      return typeof matcher === 'function' ? matcher(c, k) : matcher.test(c)
    })
    if (foundKey && row[foundKey] !== undefined && String(row[foundKey]).trim() !== '') {
      return row[foundKey]
    }
  }
  return ''
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file into a normalized array of invoice/order entries
 */
export function parseExcelInvoiceSheet(file, defaultCountry = 'IN', existingLocations = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          cellNF: false
        })

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve([])
          return
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
          defval: '',
          raw: false
        })

        if (!rawRows || rawRows.length === 0) {
          resolve([])
          return
        }

        const orders = rawRows
          .map((row, idx) => {
            // Location/Destination: highly resilient matching
            const rawLoc = getSmartValue(row, [
              (c) =>
                (c.includes('location') ||
                  c.includes('center') ||
                  c.includes('centre') ||
                  c.includes('temple') ||
                  c.includes('mandir') ||
                  c.includes('destination') ||
                  c.includes('customer') ||
                  c.includes('client') ||
                  c.includes('party') ||
                  c.includes('account') ||
                  c.includes('consignee') ||
                  c.includes('shipto') ||
                  c.includes('billto') ||
                  c.includes('place') ||
                  c.includes('store') ||
                  c === 'name' ||
                  c === 'title') &&
                !c.includes('contact') &&
                !c.includes('decision') &&
                !c.includes('phone') &&
                !c.includes('file') &&
                !c.includes('pdf') &&
                !c.includes('mail')
            ])

            // Invoice number
            const rawInvNo = getSmartValue(row, [
              (c) =>
                c.includes('invoice') ||
                c.includes('inv') ||
                c.includes('bill') ||
                c.includes('order') ||
                c.includes('receipt') ||
                c.includes('voucher')
            ])

            // Date
            const rawDate = getSmartValue(row, [
              (c) => c.includes('date') || c.includes('dated') || c.includes('day')
            ])

            // Books quantity
            const rawBooks = getSmartValue(row, [
              (c) =>
                c.includes('book') ||
                c.includes('qty') ||
                c.includes('quantity') ||
                c.includes('copies') ||
                c.includes('units') ||
                c.includes('count')
            ])

            // Amount / Price
            const rawAmount = getSmartValue(row, [
              (c) =>
                c.includes('amount') ||
                c.includes('price') ||
                c.includes('total') ||
                c.includes('cost') ||
                c.includes('value') ||
                c.includes('val') ||
                c.includes('sum') ||
                c.includes('inr') ||
                c.includes('usd')
            ])

            // Payment status
            const rawPayment = getSmartValue(row, [
              (c) =>
                c.includes('payment') ||
                c.includes('paid') ||
                c.includes('paystatus') ||
                (c === 'status' && !c.includes('order'))
            ])

            // City
            const rawCity = getSmartValue(row, [
              (c) => c.includes('city') || c.includes('town') || c.includes('district')
            ])

            // State
            const rawState = getSmartValue(row, [
              (c) => c.includes('state') || c.includes('province') || c === 'st'
            ])

            // Country
            const rawCountry = getSmartValue(row, [
              (c) => c.includes('country') || c.includes('nation')
            ])

            // Contact Name
            const rawContact = getSmartValue(row, [
              (c) =>
                (c.includes('contact') ||
                  c.includes('decision') ||
                  c.includes('person') ||
                  c.includes('receiver') ||
                  c.includes('recipient') ||
                  c.includes('attn')) &&
                !c.includes('phone') &&
                !c.includes('mobile') &&
                !c.includes('tel') &&
                !c.includes('mail')
            ])

            // Phone
            const rawPhone = getSmartValue(row, [
              (c) =>
                c.includes('phone') ||
                c.includes('mobile') ||
                c.includes('cell') ||
                c.includes('tel') ||
                c.includes('contactno')
            ])

            // Notes / Remarks
            const rawNotes = getSmartValue(row, [
              (c) =>
                c.includes('note') ||
                c.includes('remark') ||
                c.includes('comment') ||
                c.includes('desc') ||
                c.includes('memo') ||
                c.includes('track')
            ])

            const invNo = String(rawInvNo).trim()
            const books = normalizeBooks(rawBooks)
            const amount = normalizeAmount(rawAmount)
            const isPaid = normalizePayment(rawPayment)
            const invoiceDate = normalizeDate(rawDate)

            // Normalize Country
            let country = defaultCountry
            if (rawCountry) {
              const cStr = String(rawCountry).trim().toUpperCase()
              if (cStr === 'US' || cStr === 'USA' || cStr.includes('UNITED STATES')) {
                country = 'US'
              } else if (cStr === 'IN' || cStr === 'IND' || cStr.includes('INDIA')) {
                country = 'IN'
              }
            }

            // Guaranteed non-empty Location Title fallback
            let locTitle = String(rawLoc).trim()
            if (!locTitle) {
              const cityStr = String(rawCity).trim()
              if (cityStr) {
                locTitle = `${cityStr} Center`
              } else if (invNo) {
                locTitle = `Order #${invNo}`
              } else {
                locTitle = `Order Entry ${idx + 1}`
              }
            }

            // Fuzzy match existing location from database
            let matchedLoc = null
            if (locTitle && Array.isArray(existingLocations) && existingLocations.length > 0) {
              const cleanLower = locTitle.toLowerCase()
              matchedLoc = existingLocations.find(
                (l) => l.title && l.title.trim().toLowerCase() === cleanLower
              )
              if (!matchedLoc) {
                matchedLoc = existingLocations.find(
                  (l) =>
                    l.title &&
                    (l.title.toLowerCase().includes(cleanLower) || cleanLower.includes(l.title.toLowerCase()))
                )
              }
            }

            const city = String(rawCity).trim() || matchedLoc?.city || ''
            const state = String(rawState).trim() || matchedLoc?.state || ''
            const resolvedCountry = country || matchedLoc?.country || defaultCountry

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
          })
          .filter(
            (item) =>
              item.location_title ||
              item.invoice_number ||
              item.amount !== null ||
              item.books_sent > 0
          )

        resolve(orders)
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Downloads a pre-formatted Excel template for invoices
 */
export function generateSampleExcelTemplate(country = 'IN') {
  const isUS = country === 'US'

  const sampleRows = [
    {
      'Location / Center': isUS ? 'Hare Krishna Temple Dallas' : 'ISKCON Temple Vrindavan',
      'Invoice #': isUS ? 'INV-2026-101' : 'INV-2026-501',
      'Date': '2026-11-20',
      'Books Sent': 250,
      'Amount': isUS ? 750.0 : 25000.0,
      'Payment Status': 'Paid',
      'City': isUS ? 'Dallas' : 'Vrindavan',
      'State': isUS ? 'Texas' : 'Uttar Pradesh',
      'Country': isUS ? 'US' : 'IN',
      'Contact Name': isUS ? 'Govinda Das' : 'Radha Raman Das',
      'Contact Phone': isUS ? '555-019-2834' : '9876543210',
      'Notes / Remarks': 'Bhagavad Gita distribution batch'
    },
    {
      'Location / Center': isUS ? 'Bhakti Center NYC' : 'Sri Sri Radha Madhav Mandir Mayapur',
      'Invoice #': isUS ? 'INV-2026-102' : 'INV-2026-502',
      'Date': '2026-11-21',
      'Books Sent': 500,
      'Amount': isUS ? 1500.0 : 50000.0,
      'Payment Status': 'Pending',
      'City': isUS ? 'New York' : 'Nabadwip',
      'State': isUS ? 'New York' : 'West Bengal',
      'Country': isUS ? 'US' : 'IN',
      'Contact Name': isUS ? 'Ananda Murari' : 'Janardan Das',
      'Contact Phone': isUS ? '212-555-0199' : '9812345678',
      'Notes / Remarks': 'Full sets dispatch'
    },
    {
      'Location / Center': isUS ? 'ISKCON Los Angeles New Dvaraka' : 'ISKCON Bangalore Center',
      'Invoice #': isUS ? 'INV-2026-103' : 'INV-2026-503',
      'Date': '2026-11-22',
      'Books Sent': 100,
      'Amount': isUS ? 300.0 : 10000.0,
      'Payment Status': 'Paid',
      'City': isUS ? 'Los Angeles' : 'Bengaluru',
      'State': isUS ? 'California' : 'Karnataka',
      'Country': isUS ? 'US' : 'IN',
      'Contact Name': isUS ? 'Mukunda Das' : 'Shyam Sundar Das',
      'Contact Phone': isUS ? '310-555-0142' : '9845012345',
      'Notes / Remarks': 'Youth festival book distribution'
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleRows)

  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 32 }, // Location
    { wch: 15 }, // Invoice #
    { wch: 12 }, // Date
    { wch: 12 }, // Books Sent
    { wch: 12 }, // Amount
    { wch: 15 }, // Payment Status
    { wch: 16 }, // City
    { wch: 16 }, // State
    { wch: 10 }, // Country
    { wch: 20 }, // Contact Name
    { wch: 16 }, // Contact Phone
    { wch: 35 } // Notes
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Orders')

  const filename = `jivan_disha_invoices_template_${country.toLowerCase()}.xlsx`
  XLSX.writeFile(workbook, filename)
}
