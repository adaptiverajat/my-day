export async function fetchFinancesInitApi() {
  const res = await fetch('http://localhost:3001/api/finances/initialize')
  return res.json()
}

export async function fetchFinancesAllApi() {
  const res = await fetch('http://localhost:3001/api/finances')
  return res.json()
}

export async function postIncomeApi(monthId, income, incomeItems) {
  const res = await fetch('http://localhost:3001/api/finances/income', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthId, income, incomeItems, confirmed: true })
  })
  return res.json()
}

export async function postExpensesApi(monthId, knownExpenses) {
  const res = await fetch('http://localhost:3001/api/finances/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthId, knownExpenses })
  })
  return res.json()
}

export async function postUnpredictableExpensesApi(monthId, expenses) {
  const res = await fetch('http://localhost:3001/api/finances/unpredictable-expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthId, expenses })
  })
  return res.json()
}

export async function postInvestedApi(monthId, type, amount, transactions) {
  const res = await fetch('http://localhost:3001/api/finances/invested', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      monthId,
      investedType: type,
      investedAmount: amount,
      investedTransactions: transactions
    })
  })
  return res.json()
}
