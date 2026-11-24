export function detectCollectionDuplicates(parsedRecords, collections) {
  return parsedRecords.map((item, idx) => {
    const name = String(item.individual_name || '').trim().toLowerCase()
    const itemDate = item.date ? String(item.date).slice(0, 10).trim() : ''
    const dbDup = collections.some((dbItem) => {
      const dbName = String(dbItem.individual_name || '').trim().toLowerCase()
      const dbDate = dbItem.date ? String(dbItem.date).slice(0, 10).trim() : ''
      return name && dbName === name && itemDate && dbDate === itemDate
    })
    const sheetDup = parsedRecords.some((other, oIdx) => {
      if (oIdx === idx) return false
      const otherName = String(other.individual_name || '').trim().toLowerCase()
      const otherDate = other.date ? String(other.date).slice(0, 10).trim() : ''
      return name && otherName === name && itemDate && otherDate === itemDate
    })
    return { ...item, isDbDup: dbDup, isSheetDup: sheetDup }
  })
}

export function computeParsedTotals(records) {
  return records.reduce(
    (acc, r) => {
      acc.count += Number(r.count) || 0
      acc.cost += Number(r.cost) || 0
      acc.collection += Number(r.collection) || 0
      return acc
    },
    { count: 0, cost: 0, collection: 0 }
  )
}
