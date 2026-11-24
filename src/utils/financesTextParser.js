export function parseFinancialText(text) {
  const lines = text.split('\n').filter(line => line.trim())
  
  let income = null
  const expenses = []
  let endDate = null
  
  const incomePatterns = [
    /income\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /salary\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /earnings\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /monthly\s+(?:income|salary|pay)\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /take home\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /net\s+(?:is|of|:|=|=~|is approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)\s*(?:monthly|income|salary|per month)/i,
    /income[:\s]*\$?(\d[\d,]*\.?\d*)/i,
    /salary[:\s]*\$?(\d[\d,]*\.?\d*)/i,
    /earnings[:\s]*\$?(\d[\d,]*\.?\d*)/i,
    /monthly[:\s]*\$?(\d[\d,]*\.?\d*)/i,
    /take home[:\s]*\$?(\d[\d,]*\.?\d*)/i,
    /net[:\s]*\$?(\d[\d,]*\.?\d*)/i,
    /^\$?(\d[\d,]*\.?\d*)\s*(?:monthly|income|salary)/i,
    /(\d[\d,]*\.?\d*)\s*(?:monthly|income|salary)/i
  ]

  const endDatePatterns = [
    /(?:until|till|to|through)\s+(\w+)\s+(\d{4})/i,
    /(?:until|till|to|through)\s+(\d{4})/i
  ]

  const expensePatterns = [
    /(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s+)?["']?(.+?)["']?\s+of\s+(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /(.+?)\s+(?:Rs\.?|₹|\$)\s*(\d[\d,]*\.?\d*)/i,
    /(.+?)\s+(?:is|:|=|=~|costs?|approximately|around)\s*(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /(.+?)[:\s=]+(?:Rs\.?|₹|\$)?\s*(\d[\d,]*\.?\d*)/i,
    /(.+?)\s+(?:Rs\.?|₹|\$)?(\d[\d,]*\.?\d*)\s*(?:till|until|to|through)?/i
  ]

  lines.forEach(line => {
    const lowerLine = line.toLowerCase()

    for (const pattern of incomePatterns) {
      const match = line.match(pattern)
      if (match) {
        income = parseFloat(match[1].replace(/,/g, ''))
        break
      }
    }

    for (const pattern of endDatePatterns) {
      const match = line.match(pattern)
      if (match) {
        if (match[1] && match[2]) {
          const monthDate = new Date(`${match[1]} 1, ${parseInt(match[2], 10)}`)
          if (!isNaN(monthDate.getTime())) {
            endDate = monthDate
          }
        } else if (match[1]) {
          endDate = new Date(parseInt(match[1], 10), 11, 31)
        }
        break
      }
    }

    const isDateOnlyLine = /^(?:till|until|to|through|from)\s+\w+\s*\d{0,4}\s*$/i.test(line.trim())

    if (!isDateOnlyLine) {
      for (const pattern of expensePatterns) {
        const match = line.match(pattern)
        if (match) {
          let expenseName = match[1].trim()
          const expenseAmount = parseFloat(match[2].replace(/,/g, ''))

          expenseName = expenseName.replace(/^(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s+)/i, '').trim()
          expenseName = expenseName.replace(/^(?:till|until|to|through|from)\s+\w+\s*\d{0,4}\s*(?:add\s+(?:under\s+)?(?:known\s+)?(?:expense[s]?)\s*)?/i, '').trim()
          expenseName = expenseName.replace(/^["']|["']$/g, '').trim()

          if (lowerLine.includes('income') || lowerLine.includes('salary') || lowerLine.includes('earnings')) {
            break
          }
          if (/^(?:till|until|to|through|from|dec|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov)\s*\d*$/i.test(expenseName)) {
            break
          }
          if (expenseName && expenseName.length > 1 && expenseAmount > 0) {
            expenses.push({ name: expenseName, amount: expenseAmount })
            break
          }
        }
      }
    }
  })

  return { income, expenses, endDate }
}
