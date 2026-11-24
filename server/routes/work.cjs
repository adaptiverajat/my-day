const express = require('express');
const { getPool } = require('../db.cjs');

const router = express.Router();

// Get all work columns
router.get('/columns', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const [columns] = await pool.query('SELECT * FROM work_columns ORDER BY sort_order, id');

    for (const column of columns) {
      const [items] = await pool.query('SELECT * FROM work_items WHERE column_id = ? ORDER BY id', [column.id]);
      column.items = items;
    }

    res.json({ success: true, columns });
  } catch (error) {
    console.error('Error fetching work columns:', error);
    res.status(500).json({ success: false, message: 'Error fetching work columns', error: error.message });
  }
});

// Create new column
router.post('/columns', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { title, color } = req.body;

    const [result] = await pool.query(
      'INSERT INTO work_columns (title, color) VALUES (?, ?)',
      [title, color || '#e3f2fd']
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating work column:', error);
    res.status(500).json({ success: false, message: 'Error creating work column', error: error.message });
  }
});

// Update column
router.put('/columns/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { id } = req.params;
    const { title, color } = req.body;

    await pool.query(
      'UPDATE work_columns SET title = ?, color = ? WHERE id = ?',
      [title, color, id]
    );

    res.json({ success: true, message: 'Column updated' });
  } catch (error) {
    console.error('Error updating work column:', error);
    res.status(500).json({ success: false, message: 'Error updating work column', error: error.message });
  }
});

// Delete column
router.delete('/columns/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { id } = req.params;
    await pool.query('DELETE FROM work_columns WHERE id = ?', [id]);

    res.json({ success: true, message: 'Column deleted' });
  } catch (error) {
    console.error('Error deleting work column:', error);
    res.status(500).json({ success: false, message: 'Error deleting work column', error: error.message });
  }
});

// Create new item
router.post('/items', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { columnId, text, notes } = req.body;

    const [result] = await pool.query(
      'INSERT INTO work_items (column_id, text, notes) VALUES (?, ?, ?)',
      [columnId, text, notes || null]
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating work item:', error);
    res.status(500).json({ success: false, message: 'Error creating work item', error: error.message });
  }
});

// Update item
router.put('/items/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { id } = req.params;
    const { completed, text, notes } = req.body;

    let query = 'UPDATE work_items SET ';
    let params = [];
    let updates = [];

    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed);
    }
    if (text !== undefined) {
      updates.push('text = ?');
      params.push(text);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    res.json({ success: true, message: 'Item updated' });
  } catch (error) {
    console.error('Error updating work item:', error);
    res.status(500).json({ success: false, message: 'Error updating work item', error: error.message });
  }
});

// Delete item
router.delete('/items/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { id } = req.params;
    await pool.query('DELETE FROM work_items WHERE id = ?', [id]);

    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting work item:', error);
    res.status(500).json({ success: false, message: 'Error deleting work item', error: error.message });
  }
});

// Reorder columns
router.post('/columns/reorder', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { columnIds } = req.body;

    if (columnIds && Array.isArray(columnIds)) {
      for (let i = 0; i < columnIds.length; i++) {
        await pool.query(
          'UPDATE work_columns SET sort_order = ? WHERE id = ?',
          [i, columnIds[i]]
        );
      }
    }

    res.json({ success: true, message: 'Columns reordered' });
  } catch (error) {
    console.error('Error reordering work columns:', error);
    res.status(500).json({ success: false, message: 'Error reordering work columns', error: error.message });
  }
});

module.exports = router;
