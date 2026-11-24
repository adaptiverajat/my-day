import { useState } from 'react'
import { generateInitialFinanceData, getMonthsToUpdate } from './financesHelpers'
import {
  fetchFinancesInitApi,
  fetchFinancesAllApi,
  postIncomeApi,
  postExpensesApi,
  postUnpredictableExpensesApi,
  postInvestedApi
} from './financesApi'

export function useFinancesOperations(setError) {
  const [financeData, setFinanceData] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [viewOffset, setViewOffset] = useState(0)

  const loadFinanceData = async () => {
    try {
      await fetchFinancesInitApi()
      const data = await fetchFinancesAllApi()
      if (data.success) {
        const months = data.months || generateInitialFinanceData()
        setFinanceData(months)
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' })
        const currentYear = new Date().getFullYear()
        const currentMonthIndex = months.findIndex(m => m.month === currentMonthName && m.year === currentYear)
        if (currentMonthIndex >= 0) {
          setSelectedMonth(months[currentMonthIndex].id)
          setViewOffset(currentMonthIndex)
        }
      } else {
        setFinanceData(generateInitialFinanceData())
      }
    } catch (err) {
      console.error('Error loading finance data:', err)
      setFinanceData(generateInitialFinanceData())
    }
  }

  const handleConfirmIncomeWithItems = async (monthId, incomeItems, endDate = null) => {
    try {
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      if (!targetMonthId) return setError('No month available to save income')
      const totalIncome = incomeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      const monthsToUpdate = getMonthsToUpdate(financeData, targetMonthId, endDate)

      for (const month of monthsToUpdate) {
        await postIncomeApi(month.id, totalIncome, incomeItems)
      }
      await loadFinanceData()
    } catch (err) {
      console.error('Error saving income:', err)
      setError('Failed to save income')
    }
  }

  const handleUpdateExpenses = async (monthId, expenses, endDate = null) => {
    try {
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      if (!targetMonthId) return setError('No month available to update expenses')
      const monthsToUpdate = getMonthsToUpdate(financeData, targetMonthId, endDate)

      for (const month of monthsToUpdate) {
        await postExpensesApi(month.id, expenses)
      }
      await loadFinanceData()
    } catch (err) {
      console.error('Error updating expenses:', err)
      setError('Failed to update expenses')
    }
  }

  const handleMergeExpenses = async (monthId, newExpenses, endDate = null) => {
    try {
      const targetMonthId = monthId || (financeData.length > 0 ? financeData[0].id : null)
      if (!targetMonthId) return setError('No month available to update expenses')
      const monthsToUpdate = getMonthsToUpdate(financeData, targetMonthId, endDate)

      for (const month of monthsToUpdate) {
        const merged = [...(month.knownExpenses || [])]
        for (const newExp of newExpenses) {
          const idx = merged.findIndex(e => e.name.toLowerCase() === newExp.name.toLowerCase())
          if (idx >= 0) merged[idx] = { ...merged[idx], amount: newExp.amount }
          else merged.push(newExp)
        }
        await postExpensesApi(month.id, merged)
      }
      await loadFinanceData()
    } catch (err) {
      console.error('Error merging expenses:', err)
      setError('Failed to merge expenses')
    }
  }

  const handleUpdateUnpredictableExpenses = async (monthId, expenses) => {
    try {
      const data = await postUnpredictableExpensesApi(monthId, expenses)
      if (data.success) await loadFinanceData()
      else setError(data.message || 'Failed to update expenses')
    } catch (err) {
      console.error('Error updating unpredictable expenses:', err)
      setError('Failed to update expenses')
    }
  }

  const handleUpdateInvested = async (monthId, type, amount, transactions) => {
    try {
      const data = await postInvestedApi(monthId, type, amount, transactions)
      if (data.success) await loadFinanceData()
      else setError(data.message || 'Failed to update invested')
    } catch (err) {
      console.error('Error updating invested:', err)
      setError('Failed to update invested')
    }
  }

  return {
    financeData,
    setFinanceData,
    selectedMonth,
    setSelectedMonth,
    viewOffset,
    setViewOffset,
    loadFinanceData,
    handleConfirmIncomeWithItems,
    handleUpdateExpenses,
    handleMergeExpenses,
    handleUpdateUnpredictableExpenses,
    handleUpdateInvested
  }
}
