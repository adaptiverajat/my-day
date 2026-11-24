const express = require('express');
const { getPool, parseLocalDate } = require('../db.cjs');

const router = express.Router();

// Get tasks for a specific date range
router.get('/calendar-tasks', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM calendar_tasks';
    let params = [];

    if (startDate && endDate) {
      query += ' WHERE task_date BETWEEN ? AND ? ORDER BY task_date, from_time';
      params = [startDate, endDate];
    } else {
      query += ' ORDER BY task_date, from_time';
    }

    const [rows] = await pool.query(query, params);
    const tasks = rows.map(task => ({
      ...task,
      task_date: task.task_date ? String(task.task_date).slice(0, 10) : task.task_date,
      is_hidden: Boolean(task.is_hidden)
    }));
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    res.status(500).json({ success: false, message: 'Error fetching calendar tasks', error: error.message });
  }
});

// Alias endpoint for tasks (same as calendar-tasks)
router.get('/tasks', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM calendar_tasks';
    let params = [];

    if (startDate && endDate) {
      query += ' WHERE task_date BETWEEN ? AND ? ORDER BY task_date, from_time';
      params = [startDate, endDate];
    } else {
      query += ' ORDER BY task_date, from_time';
    }

    const [rows] = await pool.query(query, params);
    const tasks = rows.map(task => ({
      ...task,
      task_date: task.task_date ? String(task.task_date).slice(0, 10) : task.task_date,
      is_hidden: Boolean(task.is_hidden)
    }));
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
  }
});

// Add a new calendar task
router.post('/calendar-tasks', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden } = req.body;

    const formattedRecurrenceEndDate = recurrence_end_date
      ? (recurrence_end_date.includes('T') ? recurrence_end_date.split('T')[0] : recurrence_end_date)
      : null;

    if (is_recurring && recurrence_type && recurrence_type !== 'none') {
      const createdTasks = [];
      const endDate = formattedRecurrenceEndDate ? parseLocalDate(formattedRecurrenceEndDate) : new Date();

      if (!formattedRecurrenceEndDate) {
        endDate.setMonth(endDate.getMonth() + 12);
      }

      let currentDate = parseLocalDate(task_date);
      const maxTasks = 365;
      let taskCount = 0;

      while (currentDate <= endDate && taskCount < maxTasks) {
        const [result] = await pool.query(
          'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [title, description, currentDate.toISOString().split('T')[0], from_time, to_time, 1, recurrence_type, formattedRecurrenceEndDate, color || '#e3f2fd', is_hidden ? 1 : 0]
        );
        createdTasks.push({ id: result.insertId, date: currentDate.toISOString().split('T')[0] });
        taskCount++;

        switch (recurrence_type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        }
      }

      res.json({ success: true, tasks: createdTasks, message: `Created ${taskCount} recurring tasks` });
    } else {
      const [result] = await pool.query(
        'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, color, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, task_date, from_time, to_time, 0, 'none', color || '#e3f2fd', is_hidden ? 1 : 0]
      );
      res.json({ success: true, id: result.insertId });
    }
  } catch (error) {
    console.error('Error adding calendar task:', error);
    res.status(500).json({ success: false, message: 'Error adding calendar task', error: error.message });
  }
});

// Delete a calendar task
router.delete('/calendar-tasks/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { id } = req.params;
    const { mode } = req.query;

    if (mode === 'single' || !mode) {
      await pool.query('DELETE FROM calendar_tasks WHERE id = ?', [id]);
      res.json({ success: true, message: 'Task deleted successfully' });
    } else if (mode === 'all' || mode === 'future') {
      const [currentTask] = await pool.query('SELECT * FROM calendar_tasks WHERE id = ?', [id]);

      if (currentTask.length === 0) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const task = currentTask[0];
      let whereClause = 'WHERE title = ? AND description = ?';
      let params = [task.title, task.description];

      if (mode === 'future') {
        whereClause += ' AND task_date >= ?';
        params.push(task.task_date);
      }

      const [result] = await pool.query(`DELETE FROM calendar_tasks ${whereClause}`, params);
      res.json({ success: true, message: `Deleted ${result.affectedRows} task instances` });
    } else {
      await pool.query('DELETE FROM calendar_tasks WHERE id = ?', [id]);
      res.json({ success: true, message: 'Task deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting calendar task:', error);
    res.status(500).json({ success: false, message: 'Error deleting calendar task', error: error.message });
  }
});

// Update a calendar task
router.put('/calendar-tasks/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { id } = req.params;
    const { title, description, task_date, from_time, to_time, editMode, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden } = req.body;

    const formattedRecurrenceEndDate = recurrence_end_date
      ? (recurrence_end_date.includes('T') ? recurrence_end_date.split('T')[0] : recurrence_end_date)
      : null;

    const hiddenVal = is_hidden !== undefined ? (is_hidden ? 1 : 0) : 0;

    if (editMode === 'single') {
      await pool.query(
        'UPDATE calendar_tasks SET title = ?, description = ?, task_date = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ?, is_hidden = ? WHERE id = ?',
        [title, description, task_date, from_time, to_time, is_recurring || 0, recurrence_type || 'none', formattedRecurrenceEndDate, color || '#e3f2fd', hiddenVal, id]
      );
      res.json({ success: true, message: 'Task updated successfully' });
    } else if (editMode === 'all' || editMode === 'future') {
      const [currentTask] = await pool.query('SELECT * FROM calendar_tasks WHERE id = ?', [id]);

      if (currentTask.length === 0) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const task = currentTask[0];

      if (task.is_recurring && is_recurring && task.recurrence_type !== recurrence_type) {
        let whereClause = 'WHERE title = ? AND description = ?';
        let params = [task.title, task.description];

        if (editMode === 'future') {
          whereClause += ' AND task_date >= ?';
          params.push(task.task_date);
        }

        await pool.query(`DELETE FROM calendar_tasks ${whereClause}`, params);

        const createdTasks = [];
        const endDate = recurrence_end_date ? parseLocalDate(recurrence_end_date) : new Date();

        if (!recurrence_end_date) {
          endDate.setMonth(endDate.getMonth() + 12);
        }

        let currentDate = parseLocalDate(task_date);
        const maxTasks = 365;
        let taskCount = 0;

        while (currentDate <= endDate && taskCount < maxTasks) {
          const [result] = await pool.query(
            'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, currentDate.toISOString().split('T')[0], from_time, to_time, 1, recurrence_type, recurrence_end_date, color || '#e3f2fd', hiddenVal]
          );
          createdTasks.push({ id: result.insertId, date: currentDate.toISOString().split('T')[0] });
          taskCount++;

          switch (recurrence_type) {
            case 'daily':
              currentDate.setDate(currentDate.getDate() + 1);
              break;
            case 'weekly':
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
            case 'yearly':
              currentDate.setFullYear(currentDate.getFullYear() + 1);
              break;
          }
        }

        res.json({ success: true, message: `Regenerated ${taskCount} tasks with new recurrence pattern` });
      } else {
        let whereClause = 'WHERE title = ? AND description = ?';
        let params = [task.title, task.description];

        if (editMode === 'future') {
          whereClause += ' AND task_date >= ?';
          params.push(task.task_date);
        }

        const [result] = await pool.query(
          `UPDATE calendar_tasks SET title = ?, description = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ?, is_hidden = ? ${whereClause}`,
          [title, description, from_time, to_time, is_recurring || 0, recurrence_type || 'none', recurrence_end_date || null, color || '#e3f2fd', hiddenVal, ...params]
        );

        res.json({ success: true, message: `Updated ${result.affectedRows} task instances` });
      }
    } else {
      await pool.query(
        'UPDATE calendar_tasks SET title = ?, description = ?, task_date = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ?, is_hidden = ? WHERE id = ?',
        [title, description, task_date, from_time, to_time, is_recurring || 0, recurrence_type || 'none', formattedRecurrenceEndDate, color || '#e3f2fd', hiddenVal, id]
      );
      res.json({ success: true, message: 'Task updated successfully' });
    }
  } catch (error) {
    console.error('Error updating calendar task:', error);
    res.status(500).json({ success: false, message: 'Error updating calendar task', error: error.message });
  }
});

// Get all todo items
router.get('/todo-items', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const [rows] = await pool.query('SELECT * FROM todo_items ORDER BY created_at DESC');
    res.json({ success: true, items: rows });
  } catch (error) {
    console.error('Error fetching todo items:', error);
    res.status(500).json({ success: false, message: 'Error fetching todo items', error: error.message });
  }
});

// Add a new todo item
router.post('/todo-items', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { title } = req.body;
    const [result] = await pool.query(
      'INSERT INTO todo_items (title, completed) VALUES (?, FALSE)',
      [title]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error adding todo item:', error);
    res.status(500).json({ success: false, message: 'Error adding todo item', error: error.message });
  }
});

// Toggle or update todo item
router.put('/todo-items/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

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
    res.status(500).json({ success: false, message: 'Error updating todo item', error: error.message });
  }
});

// Delete a todo item
router.delete('/todo-items/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { id } = req.params;
    await pool.query('DELETE FROM todo_items WHERE id = ?', [id]);
    res.json({ success: true, message: 'Todo item deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo item:', error);
    res.status(500).json({ success: false, message: 'Error deleting todo item', error: error.message });
  }
});

module.exports = router;
