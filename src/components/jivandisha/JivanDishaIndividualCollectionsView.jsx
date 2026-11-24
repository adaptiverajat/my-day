import React from 'react'
import { useCollectionsData } from './collections/useCollectionsData'
import { useCollectionsMerge } from './collections/useCollectionsMerge'
import { useCollectionsExcel } from './collections/useCollectionsExcel'
import { useCollectionsManualAdd } from './collections/useCollectionsManualAdd'
import { useCollectionsEdit } from './collections/useCollectionsEdit'
import CollectionsKpiGrid from './collections/CollectionsKpiGrid'
import CollectionsExcelSection from './collections/CollectionsExcelSection'
import CollectionsVerificationTable from './collections/CollectionsVerificationTable'
import CollectionsTable from './collections/CollectionsTable'
import CollectionsEditModal from './collections/CollectionsEditModal'
import CollectionsMergeModal from './collections/CollectionsMergeModal'

export default function JivanDishaIndividualCollectionsView({
  mainTab,
  onCollectionsCountChange
}) {
  const collData = useCollectionsData({ mainTab, onCollectionsCountChange })
  const collMerge = useCollectionsMerge({
    collections: collData.collections,
    selectedIds: collData.selectedIds,
    setSelectedIds: collData.setSelectedIds,
    loadCollections: collData.loadCollections
  })
  const collExcel = useCollectionsExcel({
    collections: collData.collections,
    loadCollections: collData.loadCollections
  })
  const collAdd = useCollectionsManualAdd({
    collections: collData.collections,
    loadCollections: collData.loadCollections
  })
  const collEdit = useCollectionsEdit({ loadCollections: collData.loadCollections })

  if (mainTab !== 'collections') return null

  return (
    <div className="jd-invoices-view jd-individual-collections-view">
      <CollectionsKpiGrid stats={collData.stats} />

      <CollectionsExcelSection
        collections={collData.collections}
        dragActive={collExcel.dragActive}
        setDragActive={collExcel.setDragActive}
        fileInputRef={collExcel.fileInputRef}
        isReadingExcel={collExcel.isReadingExcel}
        excelFile={collExcel.excelFile}
        excelStatusMsg={collExcel.excelStatusMsg}
        processUploadedExcel={collExcel.processUploadedExcel}
        showAddForm={collAdd.showAddForm}
        setShowAddForm={collAdd.setShowAddForm}
        addForm={collAdd.addForm}
        setAddForm={collAdd.setAddForm}
        isSavingManual={collAdd.isSavingManual}
        handleSaveManualEntry={collAdd.handleSaveManualEntry}
      />

      <CollectionsVerificationTable
        parsedRecords={collExcel.parsedRecords}
        parsedRecordsWithDups={collExcel.parsedRecordsWithDups}
        selectedParsedRecords={collExcel.selectedParsedRecords}
        parsedTotals={collExcel.parsedTotals}
        isSavingBulk={collExcel.isSavingBulk}
        handleClearExcelSheet={collExcel.handleClearExcelSheet}
        handleSaveVerifiedRecords={collExcel.handleSaveVerifiedRecords}
        handleSelectAllParsed={collExcel.handleSelectAllParsed}
        handleToggleSelectParsed={collExcel.handleToggleSelectParsed}
        handleUpdateParsedField={collExcel.handleUpdateParsedField}
        handleRemoveParsedRow={collExcel.handleRemoveParsedRow}
      />

      <CollectionsTable
        filteredCollections={collData.filteredCollections}
        totalCollectionsCount={collData.collections.length}
        selectedIds={collData.selectedIds}
        isBulkDeleting={collData.isBulkDeleting}
        loading={collData.loading}
        searchTerm={collData.searchTerm}
        setSearchTerm={collData.setSearchTerm}
        sortBy={collData.sortBy}
        setSortBy={collData.setSortBy}
        listTotals={collData.listTotals}
        listNet={collData.listNet}
        handleOpenMergeModal={collMerge.handleOpenMergeModal}
        handleBulkDelete={collData.handleBulkDelete}
        loadCollections={collData.loadCollections}
        handleSelectAllRows={collData.handleSelectAllRows}
        handleToggleSelectRow={collData.handleToggleSelectRow}
        handleOpenEdit={collEdit.handleOpenEdit}
        handleDeleteRecord={collData.handleDeleteRecord}
      />

      <CollectionsEditModal
        editingItem={collEdit.editingItem}
        editForm={collEdit.editForm}
        setEditForm={collEdit.setEditForm}
        isSavingEdit={collEdit.isSavingEdit}
        handleCloseEdit={collEdit.handleCloseEdit}
        handleSaveEdit={collEdit.handleSaveEdit}
      />

      <CollectionsMergeModal
        showMergeModal={collMerge.showMergeModal}
        setShowMergeModal={collMerge.setShowMergeModal}
        selectedRecordsForMerge={collMerge.selectedRecordsForMerge}
        primaryRecordId={collMerge.primaryRecordId}
        handleSwitchPrimary={collMerge.handleSwitchPrimary}
        mergeForm={collMerge.mergeForm}
        setMergeForm={collMerge.setMergeForm}
        isMerging={collMerge.isMerging}
        handleConfirmMerge={collMerge.handleConfirmMerge}
      />
    </div>
  )
}
