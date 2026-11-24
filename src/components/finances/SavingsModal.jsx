import React from 'react'

export default function SavingsModal({
  showSavingsModal,
  setShowSavingsModal,
  selectedMonth,
  financeData,
  setFinanceData,
  handleUpdateUnpredictableExpenses
}) {
  if (!showSavingsModal || !selectedMonth) return null

  const selectedMonthData = financeData.find(m => m.id === selectedMonth)

  const handleRemove = (index) => {
    const newExpenses = (selectedMonthData?.unpredictableExpenses || []).filter((_, i) => i !== index)
    setFinanceData(financeData.map(m =>
      m.id === selectedMonth ? { ...m, unpredictableExpenses: newExpenses } : m
    ))
  }

  const handleAdd = () => {
    const newExpenses = [...(selectedMonthData?.unpredictableExpenses || []), { name: 'New Expense', amount: 0 }]
    setFinanceData(financeData.map(m =>
      m.id === selectedMonth ? { ...m, unpredictableExpenses: newExpenses } : m
    ))
  }

  const handleSave = async () => {
    const container = document.getElementById('unpredictable-edit-container')
    const expenseItems = container.querySelectorAll('.expense-edit-item')
    const newExpenses = Array.from(expenseItems).map(item => ({
      name: item.querySelector('.expense-name-input').value,
      amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
    }))
    await handleUpdateUnpredictableExpenses(selectedMonth, newExpenses)
  }

  return (
    <div className="modal-overlay" onClick={() => setShowSavingsModal(false)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Update Unpredictable Expenses</h3>
        <div className="expenses-edit-list" id="unpredictable-edit-container">
          {(selectedMonthData?.unpredictableExpenses || []).map((expense, index) => (
            <div key={index} className="expense-edit-item">
              <input
                type="text"
                defaultValue={expense.name}
                placeholder="Expense description"
                className="expense-name-input"
                id={`unpredictable-edit-name-${index}`}
              />
              <input
                type="number"
                defaultValue={expense.amount}
                placeholder="Amount"
                className="expense-amount-input"
                id={`unpredictable-edit-amount-${index}`}
              />
              <button
                type="button"
                className="btn-remove-expense"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemove(index)
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
                handleAdd()
              }}
            >
              Add Expense
            </button>
          </div>
        </div>
        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={() => setShowSavingsModal(false)}>Cancel</button>
          <button
            type="button"
            className="btn-save"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
