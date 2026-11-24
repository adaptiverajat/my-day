import { API_BASE_URL } from '../jivandishaHelpers'

export function detectInvoiceDuplicates(parsedOrders, allInvoices) {
  return parsedOrders.map((order, idx) => {
    const oDate = order.invoice_date ? String(order.invoice_date).slice(0, 10).trim() : ''
    const oAmt = parseFloat(order.amount)
    let dbDup = null
    if (oDate && !isNaN(oAmt) && oAmt > 0) {
      dbDup = (allInvoices || []).find((inv) => {
        const invDate = inv.invoice_date ? String(inv.invoice_date).slice(0, 10).trim() : ''
        const invAmt = Number(inv.amount)
        return invDate && invDate === oDate && !isNaN(invAmt) && Math.abs(invAmt - oAmt) < 0.01
      })
    }
    let sheetDup = false
    if (oDate && !isNaN(oAmt) && oAmt > 0) {
      sheetDup = parsedOrders.some((other, oIdx) => {
        if (oIdx === idx) return false
        const otherDate = other.invoice_date ? String(other.invoice_date).slice(0, 10).trim() : ''
        const otherAmt = parseFloat(other.amount)
        return otherDate && otherDate === oDate && !isNaN(otherAmt) && Math.abs(otherAmt - oAmt) < 0.01
      })
    }
    return { ...order, dbDuplicate: dbDup, sheetDuplicate: sheetDup }
  })
}

export async function saveInvoicesBatchApi(ordersList, defaultCountry) {
  const payload = {
    invoices: ordersList.map((o) => ({
      location_id: o.location_id || null,
      location_title: String(o.location_title || '').trim(),
      country: o.country || defaultCountry,
      city: o.city || '',
      state: o.state || '',
      address: o.city || o.location_title,
      invoice_number: o.invoice_number || '',
      invoice_date: o.invoice_date,
      books_sent: Number(o.books_sent) || 0,
      amount: o.amount !== null && o.amount !== undefined && !isNaN(parseFloat(o.amount)) ? parseFloat(o.amount) : null,
      payment_received: Boolean(o.payment_received),
      decision_maker_name: o.decision_maker_name || '',
      decision_maker_phone: o.decision_maker_phone || '',
      notes: o.notes || ''
    }))
  }
  const res = await fetch(`${API_BASE_URL}/invoices/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}

export function computeInvoiceListTotals(filteredAllInvoices = []) {
  return filteredAllInvoices.reduce(
    (acc, inv) => {
      acc.books += Number(inv.books_sent || 0)
      const amt = Number(inv.amount || 0)
      acc.amount += amt
      if (inv.payment_received) {
        acc.paidAmount += amt
        acc.paidCount += 1
      } else {
        acc.pendingAmount += amt
        acc.pendingCount += 1
      }
      return acc
    },
    { books: 0, amount: 0, paidAmount: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 }
  )
}

