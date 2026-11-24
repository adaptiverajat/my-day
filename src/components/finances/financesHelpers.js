export const formatIndianCounting = (amount) => {
  const absAmount = Math.abs(amount)
  if (absAmount >= 10000000) {
    const crores = Math.floor(absAmount / 10000000)
    const remainder = absAmount % 10000000
    const lakhs = Math.floor(remainder / 100000)
    return lakhs > 0 ? `${crores} Crore ${lakhs} Lakh` : `${crores} Crore`
  }
  if (absAmount >= 100000) {
    const lakhs = Math.floor(absAmount / 100000)
    const remainder = absAmount % 100000
    const thousands = Math.floor(remainder / 1000)
    return thousands > 0 ? `${lakhs} Lakh ${thousands} Thousand` : `${lakhs} Lakh`
  }
  if (absAmount >= 1000) {
    const thousands = Math.floor(absAmount / 1000)
    const remainder = absAmount % 1000
    const hundreds = Math.floor(remainder / 100)
    return hundreds > 0 ? `${thousands} Thousand ${hundreds} Hundred` : `${thousands} Thousand`
  }
  if (absAmount >= 100) {
    return `${Math.floor(absAmount / 100)} Hundred`
  }
  return ''
}

export const formatIndianNumber = (amount) => {
  const negative = amount < 0
  const absAmount = Math.abs(amount)
  const numStr = absAmount.toString()
  let formatted
  if (numStr.length <= 3) {
    formatted = numStr
  } else {
    const lastThree = numStr.slice(-3)
    const otherDigits = numStr.slice(0, -3)
    formatted = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
  }
  return negative ? '-' + formatted : formatted
}

export const calculateSavings = (month) => {
  if (!month) return 0
  const totalKnownExpenses = (month.knownExpenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  const totalUnpredictableExpenses = (month.unpredictableExpenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  return Number(month.income || 0) - totalKnownExpenses - totalUnpredictableExpenses
}

export const calculateTotalInvested = (month) => {
  if (!month) return 0
  return (month.investedTransactions || []).reduce((sum, trans) => sum + (Number(trans.amount) || 0), 0)
}

export const generateInitialFinanceData = () => {
  const months = []
  const currentDate = new Date()
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    months.push({
      id: i + 1,
      month: monthDate.toLocaleString('default', { month: 'long' }),
      year: monthDate.getFullYear(),
      income: 0,
      incomeConfirmed: false,
      knownExpenses: [],
      unpredictableExpenses: [],
      savings: 0,
      investedAmount: 0,
      investedType: 'None',
      investedTransactions: []
    })
  }
  return months
}

export const getMonthsToUpdate = (financeData, targetMonthId, endDate) => {
  if (endDate) {
    return financeData.filter(m => {
      const monthDate = new Date(m.year, new Date(`${m.month} 1, ${m.year}`).getMonth(), 1)
      return monthDate <= endDate
    })
  }
  const single = financeData.find(m => m.id === targetMonthId)
  return single ? [single] : []
}
