import { useState, useMemo } from 'react'

export function useJivanDishaFilters({ locations = [], allInvoices = [] }) {
  const [viewMode, setViewMode] = useState('side-by-side')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCountry, setFilterCountry] = useState('ALL')
  const [filterPayment, setFilterPayment] = useState('ALL')
  const [mainTab, setMainTab] = useState('maps')

  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('')
  const [invoiceFilterPayment, setInvoiceFilterPayment] = useState('ALL')
  const [invoiceFilterCountry, setInvoiceFilterCountry] = useState('ALL')
  const [invoiceSortBy, setInvoiceSortBy] = useState('date-desc')

  const [contactSearchTerm, setContactSearchTerm] = useState('')
  const [contactFilterFollowUp, setContactFilterFollowUp] = useState('ALL')
  const [contactFilterCountry, setContactFilterCountry] = useState('ALL')
  const [contactSortBy, setContactSortBy] = useState('followup-asc')

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (filterCountry !== 'ALL' && loc.country !== filterCountry) return false
      if (filterPayment === 'PAID' && !loc.payment_received) return false
      if (filterPayment === 'PENDING' && loc.payment_received) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        return (
          (loc.title || '').toLowerCase().includes(q) ||
          (loc.city || '').toLowerCase().includes(q) ||
          (loc.state || '').toLowerCase().includes(q) ||
          (loc.notes || '').toLowerCase().includes(q) ||
          (loc.decision_maker_name || '').toLowerCase().includes(q) ||
          (loc.inventory_keeper_name || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [locations, filterCountry, filterPayment, searchTerm])

  const indiaCount = useMemo(() => locations.filter((l) => l.country !== 'US').length, [locations])
  const usaCount = useMemo(() => locations.filter((l) => l.country === 'US').length, [locations])
  const totalBooks = useMemo(() => locations.reduce((sum, l) => sum + (Number(l.books_sent) || 0), 0), [locations])

  const filteredAllInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      if (invoiceFilterCountry !== 'ALL' && inv.location_country !== invoiceFilterCountry) return false
      if (invoiceFilterPayment === 'PAID' && !inv.payment_received) return false
      if (invoiceFilterPayment === 'PENDING' && inv.payment_received) return false
      if (invoiceSearchTerm.trim()) {
        const q = invoiceSearchTerm.toLowerCase()
        return (
          (inv.invoice_number || '').toLowerCase().includes(q) ||
          (inv.location_title || '').toLowerCase().includes(q) ||
          (inv.location_city || '').toLowerCase().includes(q) ||
          (inv.location_state || '').toLowerCase().includes(q) ||
          (inv.decision_maker_name || '').toLowerCase().includes(q) ||
          (inv.notes || '').toLowerCase().includes(q)
        )
      }
      return true
    }).sort((a, b) => {
      if (invoiceSortBy === 'date-desc') return (b.invoice_date || '').localeCompare(a.invoice_date || '')
      if (invoiceSortBy === 'date-asc') return (a.invoice_date || '').localeCompare(b.invoice_date || '')
      if (invoiceSortBy === 'amount-desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0)
      if (invoiceSortBy === 'amount-asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0)
      if (invoiceSortBy === 'books-desc') return (Number(b.books_sent) || 0) - (Number(a.books_sent) || 0)
      if (invoiceSortBy === 'title-asc') return (a.location_title || '').localeCompare(b.location_title || '')
      return 0
    })
  }, [allInvoices, invoiceFilterCountry, invoiceFilterPayment, invoiceSearchTerm, invoiceSortBy])

  const totalInvoicesCount = allInvoices.length
  const totalBooksAllInvoices = useMemo(() => allInvoices.reduce((s, i) => s + (Number(i.books_sent) || 0), 0), [allInvoices])
  const totalAmountAllInvoices = useMemo(() => allInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0), [allInvoices])
  const paidInvoicesCount = useMemo(() => allInvoices.filter((i) => i.payment_received).length, [allInvoices])
  const pendingInvoicesCount = useMemo(() => allInvoices.filter((i) => !i.payment_received).length, [allInvoices])

  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const filteredContacts = useMemo(() => {
    return locations.filter((loc) => {
      if (contactFilterCountry !== 'ALL' && loc.country !== contactFilterCountry) return false
      const fuDate = loc.next_follow_up_date ? String(loc.next_follow_up_date).slice(0, 10) : ''
      if (contactFilterFollowUp === 'OVERDUE' && (!fuDate || fuDate >= todayDateStr)) return false
      if (contactFilterFollowUp === 'TODAY' && fuDate !== todayDateStr) return false
      if (contactFilterFollowUp === 'UPCOMING' && (!fuDate || fuDate <= todayDateStr)) return false
      if (contactFilterFollowUp === 'NONE' && fuDate) return false
      if (contactSearchTerm.trim()) {
        const q = contactSearchTerm.toLowerCase()
        return (
          (loc.title || '').toLowerCase().includes(q) ||
          (loc.city || '').toLowerCase().includes(q) ||
          (loc.state || '').toLowerCase().includes(q) ||
          (loc.address || '').toLowerCase().includes(q) ||
          (loc.decision_maker_name || '').toLowerCase().includes(q) ||
          (loc.decision_maker_phone || '').toLowerCase().includes(q) ||
          (loc.inventory_keeper_name || '').toLowerCase().includes(q) ||
          (loc.inventory_keeper_phone || '').toLowerCase().includes(q) ||
          (loc.contact_person || '').toLowerCase().includes(q) ||
          (loc.contact_email || '').toLowerCase().includes(q) ||
          (loc.remarks || '').toLowerCase().includes(q)
        )
      }
      return true
    }).sort((a, b) => {
      const aDate = a.next_follow_up_date ? String(a.next_follow_up_date).slice(0, 10) : ''
      const bDate = b.next_follow_up_date ? String(b.next_follow_up_date).slice(0, 10) : ''
      if (contactSortBy === 'followup-asc') return (!aDate && !bDate) ? 0 : !aDate ? 1 : !bDate ? -1 : aDate.localeCompare(bDate)
      if (contactSortBy === 'followup-desc') return (!aDate && !bDate) ? 0 : !aDate ? 1 : !bDate ? -1 : bDate.localeCompare(aDate)
      if (contactSortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '')
      if (contactSortBy === 'city-asc') return (a.city || '').localeCompare(b.city || '')
      return 0
    })
  }, [locations, contactFilterCountry, contactFilterFollowUp, contactSearchTerm, contactSortBy, todayDateStr])

  const contactsDueTodayCount = useMemo(() => locations.filter((l) => l.next_follow_up_date && String(l.next_follow_up_date).slice(0, 10) === todayDateStr).length, [locations, todayDateStr])
  const contactsOverdueCount = useMemo(() => locations.filter((l) => l.next_follow_up_date && String(l.next_follow_up_date).slice(0, 10) < todayDateStr).length, [locations, todayDateStr])
  const contactsUpcomingCount = useMemo(() => locations.filter((l) => l.next_follow_up_date && String(l.next_follow_up_date).slice(0, 10) > todayDateStr).length, [locations, todayDateStr])
  const contactsNoDateCount = useMemo(() => locations.filter((l) => !l.next_follow_up_date).length, [locations])

  return {
    viewMode, setViewMode, sidebarOpen, setSidebarOpen, mainTab, setMainTab,
    searchTerm, setSearchTerm, filterCountry, setFilterCountry, filterPayment, setFilterPayment,
    invoiceSearchTerm, setInvoiceSearchTerm, invoiceFilterPayment, setInvoiceFilterPayment,
    invoiceFilterCountry, setInvoiceFilterCountry, invoiceSortBy, setInvoiceSortBy,
    contactSearchTerm, setContactSearchTerm, contactFilterFollowUp, setContactFilterFollowUp,
    contactFilterCountry, setContactFilterCountry, contactSortBy, setContactSortBy,
    filteredLocations, indiaCount, usaCount, totalBooks, filteredAllInvoices,
    totalInvoicesCount, totalBooksAllInvoices, totalAmountAllInvoices, paidInvoicesCount, pendingInvoicesCount,
    filteredContacts, contactsDueTodayCount, contactsOverdueCount, contactsUpcomingCount, contactsNoDateCount
  }
}
