import * as XLSX from 'xlsx'
import { mapRawRowToOrder } from './excelInvoiceRowMapper'

export { generateSampleExcelTemplate } from './excelInvoiceTemplate'

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
          .map((row, idx) => mapRawRowToOrder(row, idx, defaultCountry, existingLocations))
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
