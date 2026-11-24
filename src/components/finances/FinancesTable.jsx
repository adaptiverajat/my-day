import React from 'react'
import FinancesTableRow from './FinancesTableRow'

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
            <FinancesTableRow
              key={month.id}
              month={month}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              setParsedData={setParsedData}
              setShowIncomeModal={setShowIncomeModal}
              setShowExpensesModal={setShowExpensesModal}
              setShowSavingsModal={setShowSavingsModal}
              setShowInvestedModal={setShowInvestedModal}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
