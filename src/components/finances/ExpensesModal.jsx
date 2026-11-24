import React from 'react'
import SmartRemoveExpense from './SmartRemoveExpense'

export default function ExpensesModal({
  showExpensesModal,
  setShowExpensesModal,
  selectedMonth,
  financeData,
  setFinanceData,
  loadFinanceData,
  handleUpdateExpenses
}) {
  if (!showExpensesModal || !selectedMonth) return null

  const selectedMonthData = financeData.find(m => m.id === selectedMonth)

  const handleRemoveItem = (index) => {
    const newExpenses = selectedMonthData.knownExpenses.filter((_, i) => i !== index)
    setFinanceData(financeData.map(m =>
      m.id === selectedMonth ? { ...m, knownExpenses: newExpenses } : m
    ))
  }

  const handleAddItem = () => {
    const newExpenses = [...selectedMonthData.knownExpenses, { name: 'New Expense', amount: 0 }]
    setFinanceData(financeData.map(m =>
      m.id === selectedMonth ? { ...m, knownExpenses: newExpenses } : m
    ))
  }

  const handleSave = () => {
    const container = document.getElementById('expenses-edit-container')
    const expenseItems = container.querySelectorAll('.expense-edit-item')
    const newExpenses = Array.from(expenseItems).map(item => ({
      name: item.querySelector('.expense-name-input').value,
      amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
    }))
    handleUpdateExpenses(selectedMonth, newExpenses)
  }

  return (
    <div className="modal-overlay" onClick={() => setShowExpensesModal(false)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Update Known Expenses</h3>

        <SmartRemoveExpense financeData={financeData} loadFinanceData={loadFinanceData} />

        <div className="expenses-edit-list" id="expenses-edit-container">
          {selectedMonthData?.knownExpenses.map((expense, index) => (
            <div key={index} className="expense-edit-item">
              <input
                type="text"
                defaultValue={expense.name}
                placeholder="Expense name"
                className="expense-name-input"
                id={`edit-expense-name-${index}`}
              />
              <input
                type="number"
                defaultValue={expense.amount}
                placeholder="Amount"
                className="expense-amount-input"
                id={`edit-expense-amount-${index}`}
              />
              <button
                type="button"
                className="btn-remove-expense"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveItem(index)
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <div className="expense-edit-actions">
            <button
              type="button"
              className="btn-add-expense"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAddItem()
              }}
            >
              Add Expense
            </button>
          </div>
        </div>

        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={() => setShowExpensesModal(false)}>Cancel</button>
          <button type="button" className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
