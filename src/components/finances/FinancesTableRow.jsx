import React from 'react'
import { IncomeCell, ExpensesCell, SavingsCell, InvestedCell } from './FinancesCells'

export default function FinancesTableRow({
  month,
  selectedMonth,
  setSelectedMonth,
  setParsedData,
  setShowIncomeModal,
  setShowExpensesModal,
  setShowSavingsModal,
  setShowInvestedModal
}) {
  const handleEditIncome = () => {
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
  }

  const handleEditExpenses = () => {
    setSelectedMonth(month.id)
    setShowExpensesModal(true)
  }

  const handleAddSavingsExpense = () => {
    setSelectedMonth(month.id)
    setShowSavingsModal(true)
  }

  const handleEditInvested = () => {
    setSelectedMonth(month.id)
    setShowInvestedModal(true)
  }

  return (
    <tr className={selectedMonth === month.id ? 'selected-month' : ''}>
      <td className="col-timeline">
        <div className="timeline-cell">
          <div className="month-name">{month.month}</div>
          <div className="year-name">{month.year}</div>
        </div>
      </td>
      <IncomeCell month={month} onEdit={handleEditIncome} />
      <ExpensesCell month={month} onEdit={handleEditExpenses} />
      <SavingsCell month={month} onAdd={handleAddSavingsExpense} />
      <InvestedCell month={month} onEdit={handleEditInvested} />
    </tr>
  )
}
