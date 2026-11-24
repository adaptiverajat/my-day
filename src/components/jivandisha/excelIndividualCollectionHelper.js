import * as XLSX from 'xlsx'

/**
 * Normalizes fuzzy date inputs (Excel Date objects, Excel serial date codes, and string formats)
 */
export function normalizeDate(rawDate) {
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
 * Normalizes numerical amount/currency
 */
export function normalizeAmount(val) {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : parseFloat(val.toFixed(2))
  const cleaned = String(val).replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2))
}

/**
 * Normalizes integer count/quantity
 */
export function normalizeCount(val) {
  if (!val) return 0
  if (typeof val === 'number') return Math.max(0, Math.floor(val))
  const cleaned = String(val).replace(/[^0-9]/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

/**
 * Cleans string key to lower-case alphanumeric for resilient matching
 */
function cleanKey(k) {
  return String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Finds a value from a row object prioritizing exact match then aliases
 */
function getColumnValue(row, priorityKeys, fallbackMatchers = []) {
  const keys = Object.keys(row)

  // 1. Check exact / priority keys (cleaned)
  for (const pKey of priorityKeys) {
    const pClean = cleanKey(pKey)
    const found = keys.find((k) => cleanKey(k) === pClean)
    if (found && row[found] !== undefined && String(row[found]).trim() !== '') {
      return row[found]
    }
  }

  // 2. Check fallback matchers
  for (const matcher of fallbackMatchers) {
    const found = keys.find((k) => {
      const c = cleanKey(k)
      return typeof matcher === 'function' ? matcher(c, k) : matcher.test(c)
    })
    if (found && row[found] !== undefined && String(row[found]).trim() !== '') {
      return row[found]
    }
  }

  return ''
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file for Individual Collection records
 * Expected columns: Individual Name, Count, Date, Cost, Collection
 */
export function parseExcelIndividualCollectionSheet(file) {
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

        const parsedRecords = []

        rawRows.forEach((row, idx) => {
          // 1. Individual Name (Priority: 'Individual Name', 'individual_name', 'name', 'individual')
          const rawName = getColumnValue(
            row,
            ['Individual Name', 'IndividualName', 'individual_name', 'Name', 'Individual'],
            [(c) => (c.includes('individual') || c.includes('name') || c.includes('person')) && !c.includes('file')]
          )

          // 2. Count (Priority: 'Count', 'Qty', 'Quantity', 'Books')
          const rawCount = getColumnValue(
            row,
            ['Count', 'count', 'Qty', 'Quantity', 'Books', 'Book Count'],
            [(c) => c.includes('count') || c.includes('qty') || c.includes('quantity') || c.includes('books')]
          )

          // 3. Date (Priority: 'Date', 'Collection Date', 'Entry Date')
          const rawDate = getColumnValue(
            row,
            ['Date', 'date', 'Collection Date', 'Entry Date'],
            [(c) => c.includes('date') || c.includes('dt')]
          )

          // 4. Cost (Priority: 'Cost', 'Total Cost', 'Price', 'Expense')
          const rawCost = getColumnValue(
            row,
            ['Cost', 'cost', 'Total Cost', 'Price', 'Expense', 'Unit Cost'],
            [(c) => c.includes('cost') || c.includes('price') || c.includes('expense')]
          )

          // 5. Collection (Priority: 'Collection', 'Collection Amount', 'Collected', 'Amount')
          const rawCollection = getColumnValue(
            row,
            ['Collection', 'collection', 'Collection Amount', 'Collected', 'Amount', 'Total Collection'],
            [(c) => c.includes('collection') || c.includes('collected') || c.includes('amount') || c.includes('recv')]
          )

          const trimmedName = String(rawName || '').trim()

          // Only skip row if name is completely empty AND all numeric fields are zero/empty
          if (!trimmedName && !rawCount && !rawCost && !rawCollection) {
            return
          }

          parsedRecords.push({
            id: `ic_parsed_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            row_index: idx + 1,
            selected: true,
            individual_name: trimmedName,
            count: normalizeCount(rawCount),
            date: normalizeDate(rawDate),
            cost: normalizeAmount(rawCost),
            collection: normalizeAmount(rawCollection),
            notes: ''
          })
        })

        resolve(parsedRecords)
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Generates and downloads a sample Excel template with exact column names:
 * Individual Name, Count, Date, Cost, Collection
 */
export function downloadIndividualCollectionTemplate() {
  const sampleData = [
    {
      'Individual Name': 'Ramesh Patel',
      'Count': 50,
      'Date': new Date().toISOString().slice(0, 10),
      'Cost': 2500,
      'Collection': 5000
    },
    {
      'Individual Name': 'Priya Sharma',
      'Count': 25,
      'Date': new Date().toISOString().slice(0, 10),
      'Cost': 1250,
      'Collection': 2500
    },
    {
      'Individual Name': 'Amit Desai',
      'Count': 100,
      'Date': new Date().toISOString().slice(0, 10),
      'Cost': 5000,
      'Collection': 10000
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleData, {
    header: ['Individual Name', 'Count', 'Date', 'Cost', 'Collection']
  })

  // Set friendly column widths
  worksheet['!cols'] = [
    { wch: 28 }, // Individual Name
    { wch: 12 }, // Count
    { wch: 16 }, // Date
    { wch: 16 }, // Cost
    { wch: 16 }  // Collection
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Individual Collection')

  XLSX.writeFile(workbook, 'Individual_Collection_Template.xlsx')
}

/**
 * Exports collection records to an Excel file with exact column headers
 */
export function exportIndividualCollectionsToExcel(collections = []) {
  const exportRows = collections.map((item) => ({
    'Individual Name': item.individual_name || '',
    'Count': item.count || 0,
    'Date': item.date || '',
    'Cost': Number(item.cost || 0).toFixed(2),
    'Collection': Number(item.collection || 0).toFixed(2),
    'Net Balance': (Number(item.collection || 0) - Number(item.cost || 0)).toFixed(2),
    'Notes': item.notes || ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportRows, {
    header: ['Individual Name', 'Count', 'Date', 'Cost', 'Collection', 'Net Balance', 'Notes']
  })

  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 }
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Individual Collections')

  const todayStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `JivanDisha_Individual_Collections_${todayStr}.xlsx`)
}
