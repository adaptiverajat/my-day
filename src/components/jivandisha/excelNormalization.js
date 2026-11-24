import * as XLSX from 'xlsx'

export function normalizeDate(rawDate) {
  if (!rawDate) return new Date().toISOString().slice(0, 10)

  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    const y = rawDate.getFullYear()
    const m = String(rawDate.getMonth() + 1).padStart(2, '0')
    const d = String(rawDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  if (typeof rawDate === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(rawDate)
      if (parsed) {
        const y = String(parsed.y).padStart(4, '0')
        const m = String(parsed.m).padStart(2, '0')
        const d = String(parsed.d).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
    } catch {}
  }

  const str = String(rawDate).trim()

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)

  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const mdyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (mdyMatch) {
    const [, m, d, rawY] = mdyMatch
    const y = rawY.length === 2 ? `20${rawY}` : rawY
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

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

export function normalizeAmount(val) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  const cleaned = String(val).replace(/[^0-9.-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function normalizeCount(val) {
  if (!val) return 0
  if (typeof val === 'number') return Math.max(0, Math.floor(val))
  const cleaned = String(val).replace(/[^0-9]/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

export function normalizeBooks(val) {
  return normalizeCount(val)
}

export function normalizePayment(val) {
  if (typeof val === 'boolean') return val
  if (!val) return false
  const s = String(val).trim().toLowerCase()
  return ['paid', 'yes', 'true', 'done', 'received', 'cleared', '1', 'y', 'complete', 'completed'].includes(s)
}

export function cleanKey(k) {
  return String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function getColumnValue(row, priorityKeys, fallbackMatchers = []) {
  const keys = Object.keys(row)

  for (const pKey of priorityKeys) {
    const pClean = cleanKey(pKey)
    const found = keys.find((k) => cleanKey(k) === pClean)
    if (found && row[found] !== undefined && String(row[found]).trim() !== '') {
      return row[found]
    }
  }

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

export function getSmartValue(row, matchers) {
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
