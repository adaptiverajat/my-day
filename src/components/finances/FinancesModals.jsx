import React from 'react'

export function IncomeModal({
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
        
        {(parsedData?.income !== null && parsedData?.income !== undefined) && (
          <div className="form-group">
            <label>Monthly Income Items:</label>
            <div className="expenses-edit-list" id="income-items-container">
              {(parsedData?.incomeItems || [{ name: 'Salary', amount: parsedData?.income || 0 }]).map((item, index) => (
                <div key={index} className="expense-edit-item">
                  <input
                    type="text"
                    defaultValue={item.name}
                    placeholder="Income source name"
                    className="expense-name-input"
                    id={`income-item-name-${index}`}
                  />
                  <input
                    type="number"
                    defaultValue={item.amount}
                    placeholder="Amount"
                    className="expense-amount-input"
                    id={`income-item-amount-${index}`}
                  />
                  <button 
                    type="button"
                    className="btn-remove-expense"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const newItems = [...(parsedData?.incomeItems || [{ name: 'Salary', amount: parsedData?.income || 0 }])]
                      newItems.splice(index, 1)
                      setParsedData({ ...parsedData, incomeItems: newItems })
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button 
                type="button"
                className="btn-add-expense"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const currentItems = parsedData?.incomeItems || [{ name: 'Salary', amount: parsedData?.income || 0 }]
                  const newItems = [...currentItems, { name: '', amount: 0 }]
                  setParsedData({ ...parsedData, incomeItems: newItems })
                }}
              >
                Add Income Source
              </button>
            </div>
          </div>
        )}

        {!parsedData?.isIncomeEdit && (
          <div className="form-group">
            <label>Known Expenses:</label>
            <div className="expenses-edit-list" id="parsed-expenses-container">
              {(parsedData?.expenses || []).map((expense, index) => (
                <div key={index} className="expense-edit-item">
                  <input
                    type="text"
                    defaultValue={expense.name}
                    placeholder="Expense name"
                    className="expense-name-input"
                    id={`parsed-expense-name-${index}`}
                  />
                  <input
                    type="number"
                    defaultValue={expense.amount}
                    placeholder="Amount"
                    className="expense-amount-input"
                    id={`parsed-expense-amount-${index}`}
                  />
                  <button 
                    type="button"
                    className="btn-remove-expense"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const newExpenses = [...(parsedData?.expenses || [])]
                      newExpenses.splice(index, 1)
                      setParsedData({ ...parsedData, expenses: newExpenses })
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button 
                type="button"
                className="btn-add-expense"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const newExpenses = [...(parsedData?.expenses || []), { name: 'New Expense', amount: 0 }]
                  setParsedData({ ...parsedData, expenses: newExpenses })
                }}
              >
                Add Expense
              </button>
            </div>
          </div>
        )}

        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={() => setShowIncomeModal(false)}>Cancel</button>
          <button 
            type="button"
            className="btn-save" 
            onClick={() => {
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
                if (totalIncome > 0 || (incomeItems.length > 0)) {
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
            }}
          >
            {parsedData?.isIncomeEdit ? 'Save Income' : 'Confirm and Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ExpensesModal({
  showExpensesModal,
  setShowExpensesModal,
  selectedMonth,
  financeData,
  setFinanceData,
  loadFinanceData,
  handleUpdateExpenses
}) {
  if (!showExpensesModal || !selectedMonth) return null

  return (
    <div className="modal-overlay" onClick={() => setShowExpensesModal(false)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Update Known Expenses</h3>

        <div className="smart-remove-section">
          <label>Smart Remove (across all months):</label>
          <div className="smart-remove-row">
            <input
              type="text"
              id="smart-remove-name"
              placeholder="Enter expense name to remove (e.g. 'Till Dec')"
              className="smart-remove-input"
            />
            <button
              type="button"
              className="btn-smart-remove"
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                const nameToRemove = document.getElementById('smart-remove-name').value.trim()
                if (!nameToRemove) {
                  alert('Please enter an expense name to remove')
                  return
                }
                if (!confirm(`Remove all expenses matching "${nameToRemove}" across ALL months?`)) {
                  return
                }
                let removedCount = 0
                for (const month of financeData) {
                  const filtered = month.knownExpenses.filter(exp => {
                    const matches = exp.name.toLowerCase().includes(nameToRemove.toLowerCase())
                    if (matches) removedCount++
                    return !matches
                  })
                  if (filtered.length !== month.knownExpenses.length) {
                    await fetch('http://localhost:3001/api/finances/expenses', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        monthId: month.id,
                        knownExpenses: filtered
                      })
                    })
                  }
                }
                document.getElementById('smart-remove-name').value = ''
                await loadFinanceData()
                alert(`Removed ${removedCount} expense(s) matching "${nameToRemove}"`)
              }}
            >
              Smart Remove
            </button>
          </div>
          <div className="smart-remove-hint">
            This removes all expenses containing the entered name from every month.
          </div>
        </div>

        <div className="expenses-edit-list" id="expenses-edit-container">
          {financeData.find(m => m.id === selectedMonth)?.knownExpenses.map((expense, index) => (
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
                  const month = financeData.find(m => m.id === selectedMonth)
                  const newExpenses = month.knownExpenses.filter((_, i) => i !== index)
                  const updatedFinanceData = financeData.map(m => 
                    m.id === selectedMonth ? { ...m, knownExpenses: newExpenses } : m
                  )
                  setFinanceData(updatedFinanceData)
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
                const month = financeData.find(m => m.id === selectedMonth)
                const newExpenses = [...month.knownExpenses, { name: 'New Expense', amount: 0 }]
                const updatedFinanceData = financeData.map(m => 
                  m.id === selectedMonth ? { ...m, knownExpenses: newExpenses } : m
                )
                setFinanceData(updatedFinanceData)
              }}
            >
              Add Expense
            </button>
          </div>
        </div>
        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={() => setShowExpensesModal(false)}>Cancel</button>
          <button 
            type="button"
            className="btn-save" 
            onClick={() => {
              const container = document.getElementById('expenses-edit-container')
              const expenseItems = container.querySelectorAll('.expense-edit-item')
              const newExpenses = Array.from(expenseItems).map(item => ({
                name: item.querySelector('.expense-name-input').value,
                amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
              }))
              handleUpdateExpenses(selectedMonth, newExpenses)
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export function SavingsModal({
  showSavingsModal,
  setShowSavingsModal,
  selectedMonth,
  financeData,
  setFinanceData,
  handleUpdateUnpredictableExpenses
}) {
  if (!showSavingsModal || !selectedMonth) return null

  return (
    <div className="modal-overlay" onClick={() => setShowSavingsModal(false)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Update Unpredictable Expenses</h3>
        <div className="expenses-edit-list" id="unpredictable-edit-container">
          {(financeData.find(m => m.id === selectedMonth)?.unpredictableExpenses || []).map((expense, index) => (
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
                  const month = financeData.find(m => m.id === selectedMonth)
                  const newExpenses = month.unpredictableExpenses.filter((_, i) => i !== index)
                  const updatedFinanceData = financeData.map(m =>
                    m.id === selectedMonth ? { ...m, unpredictableExpenses: newExpenses } : m
                  )
                  setFinanceData(updatedFinanceData)
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
                const month = financeData.find(m => m.id === selectedMonth)
                const newExpenses = [...(month.unpredictableExpenses || []), { name: 'New Expense', amount: 0 }]
                const updatedFinanceData = financeData.map(m =>
                  m.id === selectedMonth ? { ...m, unpredictableExpenses: newExpenses } : m
                )
                setFinanceData(updatedFinanceData)
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
            onClick={async () => {
              const container = document.getElementById('unpredictable-edit-container')
              const expenseItems = container.querySelectorAll('.expense-edit-item')
              const newExpenses = Array.from(expenseItems).map(item => ({
                name: item.querySelector('.expense-name-input').value,
                amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
              }))
              await handleUpdateUnpredictableExpenses(selectedMonth, newExpenses)
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export function InvestedModal({
  showInvestedModal,
  setShowInvestedModal,
  selectedMonth,
  financeData,
  setFinanceData,
  handleUpdateInvested
}) {
  if (!showInvestedModal || !selectedMonth) return null

  return (
    <div className="modal-overlay" onClick={() => setShowInvestedModal(false)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Update Investment Status</h3>
        
        <div className="form-group">
          <label>Existing Transactions:</label>
          <div className="expenses-edit-list" id="invested-edit-container">
            {(financeData.find(m => m.id === selectedMonth)?.investedTransactions || []).map((transaction, index) => (
              <div key={index} className="expense-edit-item">
                <select
                  defaultValue={transaction.type}
                  className="expense-name-input"
                  id={`invested-edit-type-${index}`}
                >
                  <option value="Invested">Invested</option>
                  <option value="Borrowed">Borrowed</option>
                  <option value="None">None</option>
                </select>
                <input
                  type="number"
                  defaultValue={transaction.amount}
                  placeholder="Amount"
                  className="expense-amount-input"
                  id={`invested-edit-amount-${index}`}
                />
                <button
                  type="button"
                  className="btn-remove-expense"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const month = financeData.find(m => m.id === selectedMonth)
                    const newTransactions = month.investedTransactions.filter((_, i) => i !== index)
                    const updatedFinanceData = financeData.map(m => 
                      m.id === selectedMonth ? { ...m, investedTransactions: newTransactions } : m
                    )
                    setFinanceData(updatedFinanceData)
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            {(financeData.find(m => m.id === selectedMonth)?.investedTransactions || []).length === 0 && (
              <div className="no-unpredictable">No transactions yet</div>
            )}
            {((financeData.find(m => m.id === selectedMonth)?.investedTransactions || []).length > 0) && (
              <button
                type="button"
                className="btn-remove-all-expenses"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (confirm('Are you sure you want to remove all transactions for this month?')) {
                    const updatedFinanceData = financeData.map(m => 
                      m.id === selectedMonth ? { ...m, investedTransactions: [] } : m
                    )
                    setFinanceData(updatedFinanceData)
                  }
                }}
              >
                Remove All
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Add New Transaction:</label>
          <div className="expense-edit-item">
            <select id="invested-type" className="expense-name-input">
              <option value="Invested">Invested</option>
              <option value="Borrowed">Borrowed</option>
              <option value="None">None</option>
            </select>
            <input type="number" id="invested-amount" placeholder="Amount" className="expense-amount-input" />
          </div>
        </div>

        <div className="modal-buttons">
          <button type="button" className="btn-cancel" onClick={() => setShowInvestedModal(false)}>Cancel</button>
          <button 
            type="button"
            className="btn-save" 
            onClick={() => {
              const editContainer = document.getElementById('invested-edit-container')
              const editItems = editContainer.querySelectorAll('.expense-edit-item')
              const existingTransactions = Array.from(editItems).map(item => ({
                type: item.querySelector('select').value,
                amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
              }))

              const newType = document.getElementById('invested-type').value
              const newAmount = parseFloat(document.getElementById('invested-amount').value) || 0
              
              let allTransactions = [...existingTransactions]
              if (newAmount > 0) {
                allTransactions.push({ type: newType, amount: newAmount })
              }

              const nonNoneTypes = allTransactions.filter(t => t.type !== 'None')
              const primaryType = nonNoneTypes.length > 0 ? nonNoneTypes[0].type : 'None'
              
              handleUpdateInvested(selectedMonth, primaryType, 0, allTransactions)
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
