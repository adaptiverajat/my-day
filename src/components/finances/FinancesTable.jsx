import React from 'react'
import { calculateSavings, calculateTotalInvested } from './financesHelpers'

export default function FinancesTable({
  financeData,
  viewOffset,
  setViewOffset,
  selectedMonth,
  setSelectedMonth,
  setParsedData,
  setShowIncomeModal,
  setShowExpensesModal,
  setShowSavingsModal,
  setShowInvestedModal
}) {
  return (
    <div className="finances-table-container">
      <div className="table-navigation">
        <button
          type="button"
          className="nav-month-btn"
          onClick={() => setViewOffset(Math.max(0, viewOffset - 1))}
          disabled={viewOffset === 0}
        >
          ↑ Previous
        </button>
        <span className="nav-month-info">
          Showing from: {financeData[viewOffset]?.month} {financeData[viewOffset]?.year}
        </span>
        <button
          type="button"
          className="nav-month-btn"
          onClick={() => setViewOffset(Math.min(financeData.length - 1, viewOffset + 1))}
          disabled={viewOffset >= financeData.length - 1}
        >
          ↓ Next
        </button>
      </div>

      <table className="finances-table">
        <thead>
          <tr>
            <th className="col-timeline">Timeline</th>
            <th className="col-income">Monthly Income</th>
            <th className="col-expenses">Known Expenses</th>
            <th className="col-savings">Savings</th>
            <th className="col-invested">Invested</th>
          </tr>
        </thead>
        <tbody>
          {financeData.slice(viewOffset).map((month) => (
            <tr key={month.id} className={selectedMonth === month.id ? 'selected-month' : ''}>
              <td className="col-timeline">
                <div className="timeline-cell">
                  <div className="month-name">{month.month}</div>
                  <div className="year-name">{month.year}</div>
                </div>
              </td>
              <td className="col-income">
                <div className="income-cell">
                  <div className="income-amount">
                    ₹{Number(month.income).toLocaleString()}
                  </div>
                  <div className="income-items-list">
                    {(month.incomeItems || []).map((item, itemIndex) => (
                      <div key={itemIndex} className="income-item">
                        <span className="income-item-name">{item.name}</span>
                        <span className="income-item-amount">₹{Number(item.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="income-status">
                    {month.incomeConfirmed ? '✓ Confirmed' : '⚠ Pending'}
                  </div>
                  <button 
                    type="button"
                    className="btn-edit-income"
                    onClick={() => {
                      setSelectedMonth(month.id)
                      const existingItems = month.incomeItems && month.incomeItems.length > 0
                        ? month.incomeItems
                        : (month.income > 0 ? [{ name: 'Salary', amount: month.income }] : [{ name: 'Salary', amount: 0 }])
                      setParsedData({ 
                        income: month.income || 0, 
                        incomeItems: existingItems,
                        expenses: [], 
                        endDate: null,
                        isIncomeEdit: true
                      })
                      setShowIncomeModal(true)
                    }}
                  >
                    {month.incomeConfirmed ? 'Update' : 'Confirm'}
                  </button>
                </div>
              </td>
              <td className="col-expenses">
                <div className="expenses-cell">
                  <div className="expenses-list">
                    {month.knownExpenses.length > 0 ? (
                      month.knownExpenses.map((expense, expIndex) => (
                        <div key={expIndex} className="expense-item">
                          <span className="expense-name">{expense.name}</span>
                          <span className="expense-amount">₹{Number(expense.amount).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="no-expenses">No expenses set</div>
                    )}
                  </div>
                  <div className="expenses-total">
                    Total: ₹{month.knownExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0).toLocaleString()}
                  </div>
                  <button 
                    type="button"
                    className="btn-update-expenses"
                    onClick={() => {
                      setSelectedMonth(month.id)
                      setShowExpensesModal(true)
                    }}
                  >
                    Update Expenses
                  </button>
                </div>
              </td>
              <td className="col-savings">
                <div className="savings-cell">
                  <div className="savings-balance">
                    Balance: ₹{calculateSavings(month).toLocaleString()}
                  </div>
                  <div className="savings-list">
                    {month.unpredictableExpenses.length > 0 ? (
                      month.unpredictableExpenses.map((expense, expIndex) => (
                        <div key={expIndex} className="unpredictable-expense-item">
                          <span className="expense-name">{expense.name}</span>
                          <span className="expense-amount">-₹{Number(expense.amount).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="no-unpredictable">No unpredictable expenses</div>
                    )}
                  </div>
                  <button 
                    type="button"
                    className="btn-add-unpredictable"
                    onClick={() => {
                      setSelectedMonth(month.id)
                      setShowSavingsModal(true)
                    }}
                  >
                    Add Expense
                  </button>
                </div>
              </td>
              <td className="col-invested">
                <div className="invested-cell">
                  <div className="invested-header">
                    <div className="invested-type">{month.investedType}</div>
                    <div className="invested-total">
                      ₹{calculateTotalInvested(month).toLocaleString()}
                    </div>
                  </div>
                  <div className="invested-list">
                    {month.investedTransactions.length > 0 ? (
                      month.investedTransactions.map((transaction, transIndex) => (
                        <div key={transIndex} className="invested-transaction-item">
                          <span className="transaction-type">{transaction.type}</span>
                          <span className="transaction-amount">₹{Number(transaction.amount).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="no-transactions">No transactions</div>
                    )}
                  </div>
                  <button 
                    type="button"
                    className="btn-update-invested"
                    onClick={() => {
                      setSelectedMonth(month.id)
                      setShowInvestedModal(true)
                    }}
                  >
                    Update
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
