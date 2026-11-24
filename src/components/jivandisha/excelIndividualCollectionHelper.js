import * as XLSX from 'xlsx'
import {
  normalizeDate,
  normalizeAmount,
  normalizeCount,
  getColumnValue
} from './excelNormalization'

export { normalizeDate, normalizeAmount, normalizeCount } from './excelNormalization'
export { downloadIndividualCollectionTemplate, exportIndividualCollectionsToExcel } from './excelCollectionExport'

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
          const rawName = getColumnValue(
            row,
            ['Individual Name', 'IndividualName', 'individual_name', 'Name', 'Individual'],
            [(c) => (c.includes('individual') || c.includes('name') || c.includes('person')) && !c.includes('file')]
          )

          const rawCount = getColumnValue(
            row,
            ['Count', 'count', 'Qty', 'Quantity', 'Books', 'Book Count'],
            [(c) => c.includes('count') || c.includes('qty') || c.includes('quantity') || c.includes('books')]
          )

          const rawDate = getColumnValue(
            row,
            ['Date', 'date', 'Collection Date', 'Entry Date'],
            [(c) => c.includes('date') || c.includes('dt')]
          )

          const rawCost = getColumnValue(
            row,
            ['Cost', 'cost', 'Total Cost', 'Price', 'Expense', 'Unit Cost'],
            [(c) => c.includes('cost') || c.includes('price') || c.includes('expense')]
          )

          const rawCollection = getColumnValue(
            row,
            ['Collection', 'collection', 'Collection Amount', 'Collected', 'Amount', 'Total Collection'],
            [(c) => c.includes('collection') || c.includes('collected') || c.includes('amount') || c.includes('recv')]
          )

          const trimmedName = String(rawName || '').trim()

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
