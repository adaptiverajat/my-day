import * as XLSX from 'xlsx'

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

  worksheet['!cols'] = [
    { wch: 32 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
    { wch: 20 },
    { wch: 16 },
    { wch: 35 }
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Orders')

  const filename = `jivan_disha_invoices_template_${country.toLowerCase()}.xlsx`
  XLSX.writeFile(workbook, filename)
}
