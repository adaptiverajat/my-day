export const formatIndianCounting = (amount) => {
  const absAmount = Math.abs(amount)
  if (absAmount >= 10000000) {
    const crores = Math.floor(absAmount / 10000000)
    const remainder = absAmount % 10000000
    const lakhs = Math.floor(remainder / 100000)
    if (lakhs > 0) {
      return `${crores} Crore ${lakhs} Lakh`
    }
    return `${crores} Crore`
  }
  if (absAmount >= 100000) {
    const lakhs = Math.floor(absAmount / 100000)
    const remainder = absAmount % 100000
    const thousands = Math.floor(remainder / 1000)
    if (thousands > 0) {
      return `${lakhs} Lakh ${thousands} Thousand`
    }
    return `${lakhs} Lakh`
  }
  if (absAmount >= 1000) {
    const thousands = Math.floor(absAmount / 1000)
    const remainder = absAmount % 1000
    const hundreds = Math.floor(remainder / 100)
    if (hundreds > 0) {
      return `${thousands} Thousand ${hundreds} Hundred`
    }
    return `${thousands} Thousand`
  }
  if (absAmount >= 100) {
    const hundreds = Math.floor(absAmount / 100)
    return `${hundreds} Hundred`
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
