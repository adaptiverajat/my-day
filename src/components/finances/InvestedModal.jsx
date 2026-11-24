import React from 'react'

export default function InvestedModal({
  showInvestedModal,
  setShowInvestedModal,
  selectedMonth,
  financeData,
  setFinanceData,
  handleUpdateInvested
}) {
  if (!showInvestedModal || !selectedMonth) return null

  const selectedMonthData = financeData.find(m => m.id === selectedMonth)
  const transactions = selectedMonthData?.investedTransactions || []

  const handleRemoveTransaction = (index) => {
    const newTransactions = transactions.filter((_, i) => i !== index)
    setFinanceData(financeData.map(m =>
      m.id === selectedMonth ? { ...m, investedTransactions: newTransactions } : m
    ))
  }

  const handleRemoveAllTransactions = () => {
    if (confirm('Are you sure you want to remove all transactions for this month?')) {
      setFinanceData(financeData.map(m =>
        m.id === selectedMonth ? { ...m, investedTransactions: [] } : m
      ))
    }
  }

  const handleSave = () => {
    const editContainer = document.getElementById('invested-edit-container')
    const editItems = editContainer.querySelectorAll('.expense-edit-item')
    const existingTransactions = Array.from(editItems).map(item => ({
      type: item.querySelector('select').value,
      amount: parseFloat(item.querySelector('.expense-amount-input').value) || 0
    }))

    const newType = document.getElementById('invested-type')?.value || 'None'
    const newAmount = parseFloat(document.getElementById('invested-amount')?.value) || 0

    let allTransactions = [...existingTransactions]
    if (newAmount > 0) {
      allTransactions.push({ type: newType, amount: newAmount })
    }

    const nonNoneTypes = allTransactions.filter(t => t.type !== 'None')
    const primaryType = nonNoneTypes.length > 0 ? nonNoneTypes[0].type : 'None'

    handleUpdateInvested(selectedMonth, primaryType, 0, allTransactions)
  }

  return (
    <div className="modal-overlay" onClick={() => setShowInvestedModal(false)}>
      <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Update Investment Status</h3>

        <div className="form-group">
          <label>Existing Transactions:</label>
          <div className="expenses-edit-list" id="invested-edit-container">
            {transactions.map((transaction, index) => (
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
                    handleRemoveTransaction(index)
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="no-unpredictable">No transactions yet</div>
            )}
            {transactions.length > 0 && (
              <button
                type="button"
                className="btn-remove-all-expenses"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveAllTransactions()
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
          <button type="button" className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
