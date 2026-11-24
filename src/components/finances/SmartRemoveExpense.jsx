import React from 'react'

export default function SmartRemoveExpense({ financeData, loadFinanceData }) {
  const handleSmartRemove = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const nameToRemove = document.getElementById('smart-remove-name')?.value.trim()
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
    const input = document.getElementById('smart-remove-name')
    if (input) input.value = ''
    await loadFinanceData()
    alert(`Removed ${removedCount} expense(s) matching "${nameToRemove}"`)
  }

  return (
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
          onClick={handleSmartRemove}
        >
          Smart Remove
        </button>
      </div>
      <div className="smart-remove-hint">
        This removes all expenses containing the entered name from every month.
      </div>
    </div>
  )
}
