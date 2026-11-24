import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLogoMenu from './AppLogoMenu'
import FinancesAuth from './finances/FinancesAuth'
import FinancesImportSection from './finances/FinancesImportSection'
import FinancesAssetsSection from './finances/FinancesAssetsSection'
import FinancesTable from './finances/FinancesTable'
import FinancesAllModals from './finances/FinancesAllModals'
import { useFinancesAuth } from './finances/useFinancesAuth'
import { useFinancesAssets } from './finances/useFinancesAssets'
import { useFinancesOperations } from './finances/useFinancesOperations'
import { useFinancesDocumentImport } from './finances/useFinancesDocumentImport'

export default function Finances() {
  const navigate = useNavigate()

  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpensesModal, setShowExpensesModal] = useState(false)
  const [showSavingsModal, setShowSavingsModal] = useState(false)
  const [showInvestedModal, setShowInvestedModal] = useState(false)
  const [showImportSection, setShowImportSection] = useState(false)

  const operations = useFinancesOperations((msg) => auth.setError(msg))
  const assets = useFinancesAssets((msg) => auth.setError(msg))

  const auth = useFinancesAuth(() => {
    operations.loadFinanceData()
    assets.loadAssets()
  })

  const docImport = useFinancesDocumentImport(auth.setError, setShowIncomeModal)

  if (auth.isLoading) {
    return (
      <div className="finances-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <FinancesAuth
        isPasswordRetrieval={auth.isPasswordRetrieval}
        setIsPasswordRetrieval={auth.setIsPasswordRetrieval}
        userExists={auth.userExists}
        formData={auth.formData}
        setFormData={auth.setFormData}
        retrievedPassword={auth.retrievedPassword}
        error={auth.error}
        setError={auth.setError}
        success={auth.success}
        passwordKeydownCount={auth.passwordKeydownCount}
        setPasswordKeydownCount={auth.setPasswordKeydownCount}
        handlePasswordRetrieval={auth.handlePasswordRetrieval}
        handleLogin={auth.handleLogin}
        handleSetup={auth.handleSetup}
        navigate={navigate}
      />
    )
  }

  return (
    <div className="finances-page">
      <div className="finances-header">
        <AppLogoMenu title="Finances" currentScreen="finances" />
        <div className="finances-header-controls">
          <button type="button" className="btn-back" onClick={() => navigate('/')}>Back to Calendar</button>
          <button type="button" className="btn-logout" onClick={auth.handleLogout}>Logout</button>
        </div>
      </div>

      <div className="finances-content">
        <FinancesImportSection
          showImportSection={showImportSection}
          setShowImportSection={setShowImportSection}
          handleParseDocument={docImport.handleParseDocument}
          handleTextImport={docImport.handleTextImport}
          isParsing={docImport.isParsing}
          error={auth.error}
          setError={auth.setError}
        />

        <FinancesAssetsSection
          showAssetsSection={assets.showAssetsSection}
          setShowAssetsSection={assets.setShowAssetsSection}
          assets={assets.assets}
          draggedAssetId={assets.draggedAssetId}
          setDraggedAssetId={assets.setDraggedAssetId}
          handleToggleAssetExcluded={assets.handleToggleAssetExcluded}
          handleReorderAssets={assets.handleReorderAssets}
          handleDeleteAsset={assets.handleDeleteAsset}
          showAssetModal={assets.showAssetModal}
          setShowAssetModal={assets.setShowAssetModal}
          editingAssetId={assets.editingAssetId}
          setEditingAssetId={assets.setEditingAssetId}
          addingExcluded={assets.addingExcluded}
          setAddingExcluded={assets.setAddingExcluded}
          handleSaveAsset={assets.handleSaveAsset}
          error={auth.error}
        />

        <FinancesTable
          financeData={operations.financeData}
          viewOffset={operations.viewOffset}
          setViewOffset={operations.setViewOffset}
          selectedMonth={operations.selectedMonth}
          setSelectedMonth={operations.setSelectedMonth}
          setParsedData={docImport.setParsedData}
          setShowIncomeModal={setShowIncomeModal}
          setShowExpensesModal={setShowExpensesModal}
          setShowSavingsModal={setShowSavingsModal}
          setShowInvestedModal={setShowInvestedModal}
        />
      </div>

      <FinancesAllModals
        showIncomeModal={showIncomeModal}
        setShowIncomeModal={setShowIncomeModal}
        showExpensesModal={showExpensesModal}
        setShowExpensesModal={setShowExpensesModal}
        showSavingsModal={showSavingsModal}
        setShowSavingsModal={setShowSavingsModal}
        showInvestedModal={showInvestedModal}
        setShowInvestedModal={setShowInvestedModal}
        parsedData={docImport.parsedData}
        setParsedData={docImport.setParsedData}
        selectedMonth={operations.selectedMonth}
        financeData={operations.financeData}
        setFinanceData={operations.setFinanceData}
        loadFinanceData={operations.loadFinanceData}
        handleConfirmIncomeWithItems={operations.handleConfirmIncomeWithItems}
        handleMergeExpenses={operations.handleMergeExpenses}
        handleUpdateExpenses={operations.handleUpdateExpenses}
        handleUpdateUnpredictableExpenses={operations.handleUpdateUnpredictableExpenses}
        handleUpdateInvested={operations.handleUpdateInvested}
      />
    </div>
  )
}