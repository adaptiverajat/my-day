import React, { useMemo } from 'react'
import { useInvoicesEdit } from './invoices/useInvoicesEdit'
import { useInvoicesMerge } from './invoices/useInvoicesMerge'
import { useInvoicesExcel } from './invoices/useInvoicesExcel'
import { computeInvoiceListTotals } from './invoices/invoicesExcelHelper'
import InvoicesToolbar from './invoices/InvoicesToolbar'
import InvoicesTable from './invoices/InvoicesTable'
import InvoicesExcelSection from './invoices/InvoicesExcelSection'
import InvoicesBatchDuplicateModal from './invoices/InvoicesBatchDuplicateModal'
import InvoicesMergeModal from './invoices/InvoicesMergeModal'
import InvoicesEditModal from './invoices/InvoicesEditModal'

export default function JivanDishaInvoicesView({
  mainTab,
  allInvoices = [],
  locations = [],
  loadAllInvoices,
  loadLocations,
  invoiceSearchTerm,
  setInvoiceSearchTerm,
  invoiceFilterCountry,
  setInvoiceFilterCountry,
  invoiceFilterPayment,
  setInvoiceFilterPayment,
  invoiceSortBy,
  setInvoiceSortBy,
  filteredAllInvoices = [],
  loadingAllInvoices,
  handleToggleInvoicePaymentInList,
  handleDeleteInvoiceFromList
}) {
  const invoiceListTotals = useMemo(() => computeInvoiceListTotals(filteredAllInvoices), [filteredAllInvoices])

  const scrollToExtractor = () => {
    const el = document.getElementById('add-invoice-card')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const excelOps = useInvoicesExcel({ allInvoices, locations, loadAllInvoices, loadLocations })
  const mergeOps = useInvoicesMerge({ allInvoices, loadAllInvoices, loadLocations })
  const editOps = useInvoicesEdit({ locations, loadAllInvoices, loadLocations })

  return (
    <div className="jd-invoices-view" style={{ display: mainTab === 'invoices' ? 'flex' : 'none' }}>
      <InvoicesToolbar
        invoiceSearchTerm={invoiceSearchTerm}
        setInvoiceSearchTerm={setInvoiceSearchTerm}
        invoiceFilterCountry={invoiceFilterCountry}
        setInvoiceFilterCountry={setInvoiceFilterCountry}
        invoiceFilterPayment={invoiceFilterPayment}
        setInvoiceFilterPayment={setInvoiceFilterPayment}
        invoiceSortBy={invoiceSortBy}
        setInvoiceSortBy={setInvoiceSortBy}
        scrollToExtractor={scrollToExtractor}
        selectedInvoiceIds={mergeOps.selectedInvoiceIds}
        setSelectedInvoiceIds={mergeOps.setSelectedInvoiceIds}
        handleOpenInvoiceMergeModal={mergeOps.handleOpenInvoiceMergeModal}
      />

      <InvoicesTable
        filteredAllInvoices={filteredAllInvoices}
        allInvoices={allInvoices}
        loadingAllInvoices={loadingAllInvoices}
        invoiceListTotals={invoiceListTotals}
        invoiceSearchTerm={invoiceSearchTerm}
        invoiceFilterCountry={invoiceFilterCountry}
        invoiceFilterPayment={invoiceFilterPayment}
        selectedInvoiceIds={mergeOps.selectedInvoiceIds}
        setSelectedInvoiceIds={mergeOps.setSelectedInvoiceIds}
        handleToggleSelectInvoice={mergeOps.handleToggleSelectInvoice}
        handleToggleInvoicePaymentInList={handleToggleInvoicePaymentInList}
        handleOpenEditInvoice={editOps.handleOpenEditInvoice}
        handleDeleteInvoiceFromList={handleDeleteInvoiceFromList}
      />

      <InvoicesExcelSection {...excelOps} />

      <InvoicesBatchDuplicateModal
        showBatchDuplicateModal={excelOps.showBatchDuplicateModal}
        setShowBatchDuplicateModal={excelOps.setShowBatchDuplicateModal}
        selectedDups={excelOps.selectedDups}
        selectedCount={excelOps.selectedCount}
        isSavingBatch={excelOps.isSavingBatch}
        handleSaveOnlyClean={excelOps.handleSaveOnlyClean}
        handleSaveOrdersToDb={excelOps.handleSaveOrdersToDb}
      />

      <InvoicesMergeModal {...mergeOps} locations={locations} />

      <InvoicesEditModal {...editOps} locations={locations} />
    </div>
  )
}
