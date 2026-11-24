import React from 'react'
import { IncomeItemsSection, ExpensesItemsSection } from './IncomeItemsSection'

export default function IncomeModal({
  showIncomeModal,
  setShowIncomeModal,
  parsedData,
  setParsedData,
  selectedMonth,
  financeData,
  handleConfirmIncomeWithItems,
  handleMergeExpenses
}) {
  if (!showIncomeModal) return null

  const handleSave = () => {
    const incomeContainer = document.getElementById('income-items-container')
    let incomeItems = []
    let totalIncome = 0
    if (incomeContainer) {
      const incomeRows = incomeContainer.querySelectorAll('.expense-edit-item')
      incomeItems = Array.from(incomeRows).map(item => ({
        name: item.querySelector('.expense-name-input').value,
        amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
      }))
      totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0)
    }

    setParsedData({ ...parsedData, income: totalIncome, incomeItems })
    const targetMonthId = selectedMonth || (financeData.length > 0 ? financeData[0].id : null)

    if (parsedData?.isIncomeEdit) {
      handleConfirmIncomeWithItems(targetMonthId, incomeItems, null)
      setShowIncomeModal(false)
    } else {
      if (totalIncome > 0 || incomeItems.length > 0) {
        handleConfirmIncomeWithItems(targetMonthId, incomeItems, parsedData?.endDate)
      }
      const container = document.getElementById('parsed-expenses-container')
      if (container) {
        const expenseItems = container.querySelectorAll('.expense-edit-item')
        const expenses = Array.from(expenseItems).map(item => ({
          name: item.querySelector('.expense-name-input').value,
          amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
        }))
        if (expenses.length > 0) {
          handleMergeExpenses(targetMonthId, expenses, parsedData?.endDate)
        }
      }
    }
  }

  const incomeItems = parsedData?.incomeItems || [{ name: 'Salary', amount: parsedData?.income || 0 }]
  const expensesList = parsedData?.expenses || []

  return (
    <div className="modal-overlay" onClick={() => setShowIncomeModal(false)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {parsedData?.isIncomeEdit
            ? 'Update Monthly Income'
            : (parsedData?.income !== null && parsedData?.income !== undefined
                ? 'Confirm Monthly Income and Expenses'
                : 'Confirm Expenses')}
        </h3>

        {parsedData?.endDate && (
          <div className="end-date-info">
            <p><strong>Apply until:</strong> {parsedData.endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            <p><em>This will apply to all months from current month until {parsedData.endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</em></p>
          </div>
        )}

        {parsedData?.income !== null && parsedData?.income !== undefined && (
          <IncomeItemsSection
            incomeItems={incomeItems}
            onRemove={(index) => {
              const newItems = [...incomeItems]
              newItems.splice(index, 1)
              setParsedData({ ...parsedData, incomeItems: newItems })
            }}
            onAdd={() => {
              const newItems = [...incomeItems, { name: '', amount: 0 }]
              setParsedData({ ...parsedData, incomeItems: newItems })
            }}
          />
        )}

        {!parsedData?.isIncomeEdit && (
          <ExpensesItemsSection
            expenses={expensesList}
            onRemove={(index) => {
              const newExpenses = [...expensesList]
              newExpenses.splice(index, 1)
              setParsedData({ ...parsedData, expenses: newExpenses })
            }}
            onAdd={() => {
              const newExpenses = [...expensesList, { name: 'New Expense', amount: 0 }]
              setParsedData({ ...parsedData, expenses: newExpenses })
            }}
          />
        )}

        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={() => setShowIncomeModal(false)}>Cancel</button>
          <button type="button" className="btn-save" onClick={handleSave}>
            {parsedData?.isIncomeEdit ? 'Save Income' : 'Confirm and Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
