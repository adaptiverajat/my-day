const express = require('express');
const { getPool } = require('../db.cjs');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const [rows] = await pool.query('SELECT * FROM todo_items ORDER BY created_at DESC');
    res.json({ success: true, items: rows });
  } catch (error) {
    console.error('Error fetching todo items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { title } = req.body;
    const [result] = await pool.query('INSERT INTO todo_items (title, completed) VALUES (?, FALSE)', [title]);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error adding todo item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { id } = req.params;
    const { completed, title } = req.body;

    if (title !== undefined) {
      await pool.query('UPDATE todo_items SET title = ? WHERE id = ?', [title, id]);
    } else {
      await pool.query('UPDATE todo_items SET completed = ? WHERE id = ?', [completed, id]);
    }

    res.json({ success: true, message: 'Todo item updated successfully' });
  } catch (error) {
    console.error('Error updating todo item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { id } = req.params;
    await pool.query('DELETE FROM todo_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Todo item deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
