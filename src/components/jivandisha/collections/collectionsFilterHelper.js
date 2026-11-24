export function filterAndSortCollections(collections, searchTerm, sortBy) {
  let list = [...collections]
  if (searchTerm && searchTerm.trim()) {
    const q = searchTerm.toLowerCase().trim()
    list = list.filter(
      (c) =>
        (c.individual_name && c.individual_name.toLowerCase().includes(q)) ||
        (c.date && c.date.includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    )
  }
  const comp = {
    'date-desc': (a, b) => (b.date || '').localeCompare(a.date || ''),
    'date-asc': (a, b) => (a.date || '').localeCompare(b.date || ''),
    'name-asc': (a, b) => (a.individual_name || '').localeCompare(b.individual_name || ''),
    'name-desc': (a, b) => (b.individual_name || '').localeCompare(a.individual_name || ''),
    'count-desc': (a, b) => (b.count || 0) - (a.count || 0),
    'collection-desc': (a, b) => (b.collection || 0) - (a.collection || 0),
    'cost-desc': (a, b) => (b.cost || 0) - (a.cost || 0)
  }[sortBy]
  return comp ? list.sort(comp) : list
}

export function computeCollectionTotals(list) {
  return list.reduce(
    (acc, item) => {
      acc.count += Number(item.count || 0)
      acc.cost += Number(item.cost || 0)
      acc.collection += Number(item.collection || 0)
      return acc
    },
    { count: 0, cost: 0, collection: 0 }
  )
}
