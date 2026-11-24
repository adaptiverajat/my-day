const express = require('express');
const { getPool } = require('../db.cjs');

const router = express.Router();

// Initialize finances data (ensure months exist)
router.get('/initialize', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentYear = new Date().getFullYear();

    for (const month of months) {
      await pool.query(
        'INSERT IGNORE INTO finances_months (month, year) VALUES (?, ?)',
        [month, currentYear]
      );
    }

    res.json({ success: true, message: 'Finances initialized' });
  } catch (error) {
    console.error('Error initializing finances:', error);
    res.status(500).json({ success: false, message: 'Error initializing finances', error: error.message });
  }
});

// Get all finances data
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const [months] = await pool.query('SELECT * FROM finances_months ORDER BY year, FIELD(month, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")');

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

    res.json({ success: true, months });
  } catch (error) {
    console.error('Error fetching finances:', error);
    res.status(500).json({ success: false, message: 'Error fetching finances', error: error.message });
  }
});

// Parse document (PDF/Excel/text) - placeholder
router.post('/parse', async (req, res) => {
  try {
    const { fileType, content } = req.body;
    res.json({ success: false, message: 'Document parsing not yet implemented' });
  } catch (error) {
    console.error('Error parsing document:', error);
    res.status(500).json({ success: false, message: 'Error parsing document', error: error.message });
  }
});

// Update income for a month
router.post('/income', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { monthId, income, incomeConfirmed, incomeItems } = req.body;

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

    res.json({ success: true, message: 'Income updated' });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ success: false, message: 'Error updating income', error: error.message });
  }
});

// Update known expenses for a month
router.post('/expenses', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { monthId, knownExpenses } = req.body;

    await pool.query('DELETE FROM finances_known_expenses WHERE month_id = ?', [monthId]);

    if (knownExpenses && Array.isArray(knownExpenses)) {
      for (const expense of knownExpenses) {
        await pool.query(
          'INSERT INTO finances_known_expenses (month_id, name, amount) VALUES (?, ?, ?)',
          [monthId, expense.name, expense.amount]
        );
      }
    }

    res.json({ success: true, message: 'Expenses updated' });
  } catch (error) {
    console.error('Error updating expenses:', error);
    res.status(500).json({ success: false, message: 'Error updating expenses', error: error.message });
  }
});

// Update unpredictable expenses for a month
router.post('/unpredictable-expenses', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { monthId, unpredictableExpenses } = req.body;

    await pool.query('DELETE FROM finances_unpredictable_expenses WHERE month_id = ?', [monthId]);

    if (unpredictableExpenses && Array.isArray(unpredictableExpenses)) {
      for (const expense of unpredictableExpenses) {
        await pool.query(
          'INSERT INTO finances_unpredictable_expenses (month_id, name, amount) VALUES (?, ?, ?)',
          [monthId, expense.name, expense.amount]
        );
      }
    }

    res.json({ success: true, message: 'Unpredictable expenses updated' });
  } catch (error) {
    console.error('Error updating unpredictable expenses:', error);
    res.status(500).json({ success: false, message: 'Error updating unpredictable expenses', error: error.message });
  }
});

// Update invested amount for a month
router.post('/invested', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { monthId, type, amount, transactions } = req.body;

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

    res.json({ success: true, message: 'Invested updated' });
  } catch (error) {
    console.error('Error updating invested:', error);
    res.status(500).json({ success: false, message: 'Error updating invested', error: error.message });
  }
});

// Get all assets
router.get('/assets', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const [assets] = await pool.query('SELECT * FROM finances_assets ORDER BY sort_order, id');
    res.json({ success: true, assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, message: 'Error fetching assets', error: error.message });
  }
});

// Add new asset
router.post('/assets', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { name, amount, category, type, excluded, percent } = req.body;

    const [result] = await pool.query(
      'INSERT INTO finances_assets (name, amount, category, type, excluded, percent) VALUES (?, ?, ?, ?, ?, ?)',
      [name, amount, category, type, excluded || false, percent || null]
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error adding asset:', error);
    res.status(500).json({ success: false, message: 'Error adding asset', error: error.message });
  }
});

// Update asset
router.put('/assets/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { id } = req.params;
    const { name, amount, category, type, excluded, percent } = req.body;

    await pool.query(
      'UPDATE finances_assets SET name = ?, amount = ?, category = ?, type = ?, excluded = ?, percent = ? WHERE id = ?',
      [name, amount, category, type, excluded || false, percent || null, id]
    );

    res.json({ success: true, message: 'Asset updated' });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ success: false, message: 'Error updating asset', error: error.message });
  }
});

// Delete asset
router.delete('/assets/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { id } = req.params;
    await pool.query('DELETE FROM finances_assets WHERE id = ?', [id]);

    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ success: false, message: 'Error deleting asset', error: error.message });
  }
});

// Reorder assets
router.post('/assets/reorder', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { assetIds } = req.body;

    if (assetIds && Array.isArray(assetIds)) {
      for (let i = 0; i < assetIds.length; i++) {
        await pool.query(
          'UPDATE finances_assets SET sort_order = ? WHERE id = ?',
          [i, assetIds[i]]
        );
      }
    }

    res.json({ success: true, message: 'Assets reordered' });
  } catch (error) {
    console.error('Error reordering assets:', error);
    res.status(500).json({ success: false, message: 'Error reordering assets', error: error.message });
  }
});

module.exports = router;
