import * as XLSX from 'xlsx'

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

  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 }
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Individual Collection')
  XLSX.writeFile(workbook, 'Individual_Collection_Template.xlsx')
}

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
