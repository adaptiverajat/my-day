import React from 'react'
import { calculateSavings, calculateTotalInvested } from './financesHelpers'

export function IncomeCell({ month, onEdit }) {
  return (
    <td className="col-income">
      <div className="income-cell">
        <div className="income-amount">₹{Number(month.income).toLocaleString()}</div>
        <div className="income-items-list">
          {(month.incomeItems || []).map((item, i) => (
            <div key={i} className="income-item">
              <span className="income-item-name">{item.name}</span>
              <span className="income-item-amount">₹{Number(item.amount).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="income-status">
          {month.incomeConfirmed ? '✓ Confirmed' : '⚠ Pending'}
        </div>
        <button type="button" className="btn-edit-income" onClick={onEdit}>
          {month.incomeConfirmed ? 'Update' : 'Confirm'}
        </button>
      </div>
    </td>
  )
}

export function ExpensesCell({ month, onEdit }) {
  const expensesTotal = (month.knownExpenses || []).reduce(
    (sum, exp) => sum + (Number(exp.amount) || 0),
    0
  )
  return (
    <td className="col-expenses">
      <div className="expenses-cell">
        <div className="expenses-list">
          {(month.knownExpenses || []).length > 0 ? (
            month.knownExpenses.map((exp, i) => (
              <div key={i} className="expense-item">
                <span className="expense-name">{exp.name}</span>
                <span className="expense-amount">₹{Number(exp.amount).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="no-expenses">No expenses set</div>
          )}
        </div>
        <div className="expenses-total">Total: ₹{expensesTotal.toLocaleString()}</div>
        <button type="button" className="btn-update-expenses" onClick={onEdit}>
          Update Expenses
        </button>
      </div>
    </td>
  )
}

export function SavingsCell({ month, onAdd }) {
  return (
    <td className="col-savings">
      <div className="savings-cell">
        <div className="savings-balance">
          Balance: ₹{calculateSavings(month).toLocaleString()}
        </div>
        <div className="savings-list">
          {(month.unpredictableExpenses || []).length > 0 ? (
            month.unpredictableExpenses.map((exp, i) => (
              <div key={i} className="unpredictable-expense-item">
                <span className="expense-name">{exp.name}</span>
                <span className="expense-amount">-₹{Number(exp.amount).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="no-unpredictable">No unpredictable expenses</div>
          )}
        </div>
        <button type="button" className="btn-add-unpredictable" onClick={onAdd}>
          Add Expense
        </button>
      </div>
    </td>
  )
}

export function InvestedCell({ month, onEdit }) {
  return (
    <td className="col-invested">
      <div className="invested-cell">
        <div className="invested-header">
          <div className="invested-type">{month.investedType}</div>
          <div className="invested-total">
            ₹{calculateTotalInvested(month).toLocaleString()}
          </div>
        </div>
        <div className="invested-list">
          {(month.investedTransactions || []).length > 0 ? (
            month.investedTransactions.map((txn, i) => (
              <div key={i} className="invested-transaction-item">
                <span className="transaction-type">{txn.type}</span>
                <span className="transaction-amount">₹{Number(txn.amount).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="no-transactions">No transactions</div>
          )}
        </div>
        <button type="button" className="btn-update-invested" onClick={onEdit}>
          Update
        </button>
      </div>
    </td>
  )
}
