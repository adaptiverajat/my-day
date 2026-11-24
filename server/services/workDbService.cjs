const { getPool } = require('../db.cjs');

const fetchWorkColumnsWithItems = async () => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  const [columns] = await pool.query('SELECT * FROM work_columns ORDER BY sort_order, id');
  for (const column of columns) {
    const [items] = await pool.query('SELECT * FROM work_items WHERE column_id = ? ORDER BY id', [column.id]);
    column.items = items;
  }
  return columns;
};

const createWorkColumn = async (title, color) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  const [result] = await pool.query(
    'INSERT INTO work_columns (title, color) VALUES (?, ?)',
    [title, color || '#e3f2fd']
  );
  return result.insertId;
};

const updateWorkColumn = async (id, title, color) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  await pool.query('UPDATE work_columns SET title = ?, color = ? WHERE id = ?', [title, color, id]);
};

const deleteWorkColumn = async (id) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  await pool.query('DELETE FROM work_columns WHERE id = ?', [id]);
};

const reorderWorkColumns = async (columnIds) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  if (columnIds && Array.isArray(columnIds)) {
    for (let i = 0; i < columnIds.length; i++) {
      await pool.query('UPDATE work_columns SET sort_order = ? WHERE id = ?', [i, columnIds[i]]);
    }
  }
};

const createWorkItem = async (columnId, text, notes) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  const [result] = await pool.query(
    'INSERT INTO work_items (column_id, text, notes) VALUES (?, ?, ?)',
    [columnId, text, notes || null]
  );
  return result.insertId;
};

const updateWorkItem = async (id, { completed, text, notes }) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  const updates = [];
  const params = [];
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

  if (updates.length > 0) {
    params.push(id);
    await pool.query(`UPDATE work_items SET ${updates.join(', ')} WHERE id = ?`, params);
  }
};

const deleteWorkItem = async (id) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  await pool.query('DELETE FROM work_items WHERE id = ?', [id]);
};

module.exports = {
  fetchWorkColumnsWithItems,
  createWorkColumn,
  updateWorkColumn,
  deleteWorkColumn,
  reorderWorkColumns,
  createWorkItem,
  updateWorkItem,
  deleteWorkItem
};
