import React from 'react'
import LocationModal from './LocationModal'
import InvoiceHistoryModal from './InvoiceHistoryModal'
import BatchImportModal from './BatchImportModal'
import FollowUpModal from './FollowUpModal'

export default function JivanDishaAllModals({
  locModal,
  historyModal,
  batchModal,
  followUpModal,
  cityAuto
}) {
  return (
    <>
      <LocationModal
        modalOpen={locModal.modalOpen}
        setModalOpen={locModal.setModalOpen}
        editingLocation={locModal.editingLocation}
        formData={locModal.formData}
        setFormData={locModal.setFormData}
        handleSaveLocation={locModal.handleSaveLocation}
        handleRemovePdf={locModal.handleRemovePdf}
        uploadingPdf={locModal.uploadingPdf}
        handlePdfUpload={locModal.handlePdfUpload}
        setBatchModalOpen={batchModal.setBatchModalOpen}
        pdfStatusMsg={locModal.pdfStatusMsg}
        cityInputRef={cityAuto.cityInputRef}
        isSearchingCity={cityAuto.isSearchingCity}
        handleCityChange={cityAuto.handleCityChange}
        citySuggestions={cityAuto.citySuggestions}
        setCitySuggestions={cityAuto.setCitySuggestions}
        showCityDropdown={cityAuto.showCityDropdown}
        setShowCityDropdown={cityAuto.setShowCityDropdown}
        handleSelectCitySuggestion={cityAuto.handleSelectCitySuggestion}
      />

      <InvoiceHistoryModal
        historyModalOpen={historyModal.historyModalOpen}
        setHistoryModalOpen={historyModal.setHistoryModalOpen}
        selectedLocationForHistory={historyModal.selectedLocationForHistory}
        invoices={historyModal.invoices}
        historyTotalBooks={historyModal.historyTotalBooks}
        historyPaidCount={historyModal.historyPaidCount}
        uploadingHistoryPdf={historyModal.uploadingHistoryPdf}
        handleHistoryPdfUpload={historyModal.handleHistoryPdfUpload}
        newInvoiceData={historyModal.newInvoiceData}
        setNewInvoiceData={historyModal.setNewInvoiceData}
        handleAddNewInvoice={historyModal.handleAddNewInvoice}
        loadingInvoices={historyModal.loadingInvoices}
        handleToggleInvoicePayment={historyModal.handleToggleInvoicePayment}
        handleDeleteInvoice={historyModal.handleDeleteInvoice}
      />

      <BatchImportModal
        batchModalOpen={batchModal.batchModalOpen}
        setBatchModalOpen={batchModal.setBatchModalOpen}
        isBatchProcessing={batchModal.isBatchProcessing}
        batchCountry={batchModal.batchCountry}
        setBatchCountry={batchModal.setBatchCountry}
        batchFiles={batchModal.batchFiles}
        batchProcessedCount={batchModal.batchProcessedCount}
        batchSuccessCount={batchModal.batchSuccessCount}
        batchPendingCount={batchModal.batchPendingCount}
        handleBatchFileSelect={batchModal.handleBatchFileSelect}
        handleRemoveBatchFile={batchModal.handleRemoveBatchFile}
        handleClearBatchFiles={batchModal.handleClearBatchFiles}
        runBatchImport={batchModal.runBatchImport}
      />

      <FollowUpModal
        followUpModalOpen={followUpModal.followUpModalOpen}
        setFollowUpModalOpen={followUpModal.setFollowUpModalOpen}
        followUpLocation={followUpModal.followUpLocation}
        handleSaveFollowUp={followUpModal.handleSaveFollowUp}
        handleSetFollowUpDatePreset={followUpModal.handleSetFollowUpDatePreset}
        followUpForm={followUpModal.followUpForm}
        setFollowUpForm={followUpModal.setFollowUpForm}
        isSavingFollowUp={followUpModal.isSavingFollowUp}
      />
    </>
  )
}
