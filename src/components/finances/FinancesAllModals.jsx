import React from 'react'
import {
  IncomeModal,
  ExpensesModal,
  SavingsModal,
  InvestedModal
} from './FinancesModals'

export default function FinancesAllModals({
  showIncomeModal,
  setShowIncomeModal,
  showExpensesModal,
  setShowExpensesModal,
  showSavingsModal,
  setShowSavingsModal,
  showInvestedModal,
  setShowInvestedModal,
  parsedData,
  setParsedData,
  selectedMonth,
  financeData,
  setFinanceData,
  loadFinanceData,
  handleConfirmIncomeWithItems,
  handleMergeExpenses,
  handleUpdateExpenses,
  handleUpdateUnpredictableExpenses,
  handleUpdateInvested
}) {
  return (
    <>
      <IncomeModal
        showIncomeModal={showIncomeModal}
        setShowIncomeModal={setShowIncomeModal}
        parsedData={parsedData}
        setParsedData={setParsedData}
        selectedMonth={selectedMonth}
        financeData={financeData}
        handleConfirmIncomeWithItems={handleConfirmIncomeWithItems}
        handleMergeExpenses={handleMergeExpenses}
      />

      <ExpensesModal
        showExpensesModal={showExpensesModal}
        setShowExpensesModal={setShowExpensesModal}
        selectedMonth={selectedMonth}
        financeData={financeData}
        setFinanceData={setFinanceData}
        loadFinanceData={loadFinanceData}
        handleUpdateExpenses={handleUpdateExpenses}
      />

      <SavingsModal
        showSavingsModal={showSavingsModal}
        setShowSavingsModal={setShowSavingsModal}
        selectedMonth={selectedMonth}
        financeData={financeData}
        setFinanceData={setFinanceData}
        handleUpdateUnpredictableExpenses={handleUpdateUnpredictableExpenses}
      />

      <InvestedModal
        showInvestedModal={showInvestedModal}
        setShowInvestedModal={setShowInvestedModal}
        selectedMonth={selectedMonth}
        financeData={financeData}
        setFinanceData={setFinanceData}
        handleUpdateInvested={handleUpdateInvested}
      />
    </>
  )
}
