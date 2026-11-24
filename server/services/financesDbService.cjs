const { getPool } = require('../db.cjs');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

async function initializeFinances() {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  const currentYear = new Date().getFullYear();
  for (const month of MONTH_NAMES) {
    await pool.query(
      'INSERT IGNORE INTO finances_months (month, year) VALUES (?, ?)',
      [month, currentYear]
    );
  }
}

async function getAllFinances() {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  const [months] = await pool.query(
    'SELECT * FROM finances_months ORDER BY year, FIELD(month, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")'
  );

  for (const month of months) {
    const [knownExpenses] = await pool.query('SELECT * FROM finances_known_expenses WHERE month_id = ?', [month.id]);
    const [unpredictableExpenses] = await pool.query('SELECT * FROM finances_unpredictable_expenses WHERE month_id = ?', [month.id]);
    const [investedTransactions] = await pool.query('SELECT * FROM finances_invested_transactions WHERE month_id = ?', [month.id]);
    const [incomeItems] = await pool.query('SELECT * FROM finances_income_items WHERE month_id = ?', [month.id]);

    month.knownExpenses = knownExpenses;
    month.unpredictableExpenses = unpredictableExpenses;
    month.investedTransactions = investedTransactions;
    month.incomeItems = incomeItems;
  }

  return months;
}

async function updateIncome(monthId, income, incomeConfirmed, incomeItems) {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  await pool.query(
    'UPDATE finances_months SET income = ?, income_confirmed = ? WHERE id = ?',
    [income, incomeConfirmed, monthId]
  );

  if (incomeItems && Array.isArray(incomeItems)) {
    await pool.query('DELETE FROM finances_income_items WHERE month_id = ?', [monthId]);
    for (const item of incomeItems) {
      await pool.query(
        'INSERT INTO finances_income_items (month_id, name, amount) VALUES (?, ?, ?)',
        [monthId, item.name || 'Salary', item.amount || 0]
      );
    }
  }
}

async function updateKnownExpenses(monthId, knownExpenses) {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  await pool.query('DELETE FROM finances_known_expenses WHERE month_id = ?', [monthId]);
  if (knownExpenses && Array.isArray(knownExpenses)) {
    for (const expense of knownExpenses) {
      await pool.query(
        'INSERT INTO finances_known_expenses (month_id, name, amount) VALUES (?, ?, ?)',
        [monthId, expense.name, expense.amount]
      );
    }
  }
}

async function updateUnpredictableExpenses(monthId, unpredictableExpenses) {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  await pool.query('DELETE FROM finances_unpredictable_expenses WHERE month_id = ?', [monthId]);
  if (unpredictableExpenses && Array.isArray(unpredictableExpenses)) {
    for (const expense of unpredictableExpenses) {
      await pool.query(
        'INSERT INTO finances_unpredictable_expenses (month_id, name, amount) VALUES (?, ?, ?)',
        [monthId, expense.name, expense.amount]
      );
    }
  }
}

async function updateInvested(monthId, type, amount, transactions) {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  await pool.query(
    'UPDATE finances_months SET invested_type = ?, invested_amount = ? WHERE id = ?',
    [type, amount, monthId]
  );

  if (transactions && Array.isArray(transactions)) {
    await pool.query('DELETE FROM finances_invested_transactions WHERE month_id = ?', [monthId]);
    for (const txn of transactions) {
      await pool.query(
        'INSERT INTO finances_invested_transactions (month_id, type, amount) VALUES (?, ?, ?)',
        [monthId, txn.type, txn.amount]
      );
    }
  }
}

module.exports = {
  initializeFinances,
  getAllFinances,
  updateIncome,
  updateKnownExpenses,
  updateUnpredictableExpenses,
  updateInvested
};
