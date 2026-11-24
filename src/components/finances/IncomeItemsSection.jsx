import React from 'react'

export function IncomeItemsSection({ incomeItems, onRemove, onAdd }) {
  return (
    <div className="form-group">
      <label>Monthly Income Items:</label>
      <div className="expenses-edit-list" id="income-items-container">
        {incomeItems.map((item, index) => (
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
                onRemove(index)
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
            onAdd()
          }}
        >
          Add Income Source
        </button>
      </div>
    </div>
  )
}

export function ExpensesItemsSection({ expenses, onRemove, onAdd }) {
  return (
    <div className="form-group">
      <label>Known Expenses:</label>
      <div className="expenses-edit-list" id="parsed-expenses-container">
        {expenses.map((expense, index) => (
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
                onRemove(index)
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
            onAdd()
          }}
        >
          Add Expense
        </button>
      </div>
    </div>
  )
}
