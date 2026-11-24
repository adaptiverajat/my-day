const { getPool, parseLocalDate } = require('../db.cjs');
const { generateRecurringDates } = require('./recurrenceService.cjs');

const fetchCalendarTasks = async (startDate, endDate) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  let query = 'SELECT * FROM calendar_tasks';
  let params = [];

  if (startDate && endDate) {
    query += ' WHERE task_date BETWEEN ? AND ? ORDER BY task_date, from_time';
    params = [startDate, endDate];
  } else {
    query += ' ORDER BY task_date, from_time';
  }

  const [rows] = await pool.query(query, params);
  return rows.map(task => ({
    ...task,
    task_date: task.task_date ? String(task.task_date).slice(0, 10) : task.task_date,
    is_hidden: Boolean(task.is_hidden)
  }));
};

const createCalendarTask = async (taskData) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  const { title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden } = taskData;
  const formattedEndDate = recurrence_end_date ? (recurrence_end_date.includes('T') ? recurrence_end_date.split('T')[0] : recurrence_end_date) : null;
  const hiddenVal = is_hidden ? 1 : 0;
  const taskColor = color || '#e3f2fd';

  if (is_recurring && recurrence_type && recurrence_type !== 'none') {
    const dates = generateRecurringDates(task_date, recurrence_type, formattedEndDate);
    const createdTasks = [];

    for (const dateStr of dates) {
      const [result] = await pool.query(
        'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, dateStr, from_time, to_time, 1, recurrence_type, formattedEndDate, taskColor, hiddenVal]
      );
      createdTasks.push({ id: result.insertId, date: dateStr });
    }

    return { tasks: createdTasks, message: `Created ${dates.length} recurring tasks` };
  } else {
    const [result] = await pool.query(
      'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, color, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, task_date, from_time, to_time, 0, 'none', taskColor, hiddenVal]
    );
    return { id: result.insertId };
  }
};

const deleteCalendarTask = async (id, mode) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  if (mode === 'all' || mode === 'future') {
    const [currentTask] = await pool.query('SELECT * FROM calendar_tasks WHERE id = ?', [id]);
    if (currentTask.length === 0) return { notFound: true };

    const task = currentTask[0];
    let whereClause = 'WHERE title = ? AND description = ?';
    let params = [task.title, task.description];

    if (mode === 'future') {
      whereClause += ' AND task_date >= ?';
      params.push(task.task_date);
    }

    const [result] = await pool.query(`DELETE FROM calendar_tasks ${whereClause}`, params);
    return { affectedRows: result.affectedRows };
  }

  await pool.query('DELETE FROM calendar_tasks WHERE id = ?', [id]);
  return { affectedRows: 1 };
};

const updateCalendarTask = async (id, taskData) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  const { title, description, task_date, from_time, to_time, editMode, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden } = taskData;
  const formattedEndDate = recurrence_end_date ? (recurrence_end_date.includes('T') ? recurrence_end_date.split('T')[0] : recurrence_end_date) : null;
  const hiddenVal = is_hidden !== undefined ? (is_hidden ? 1 : 0) : 0;
  const taskColor = color || '#e3f2fd';

  if (editMode === 'all' || editMode === 'future') {
    const [currentTask] = await pool.query('SELECT * FROM calendar_tasks WHERE id = ?', [id]);
    if (currentTask.length === 0) return { notFound: true };

    const task = currentTask[0];
    let whereClause = 'WHERE title = ? AND description = ?';
    let params = [task.title, task.description];
    if (editMode === 'future') {
      whereClause += ' AND task_date >= ?';
      params.push(task.task_date);
    }

    if (task.is_recurring && is_recurring && task.recurrence_type !== recurrence_type) {
      await pool.query(`DELETE FROM calendar_tasks ${whereClause}`, params);
      const dates = generateRecurringDates(task_date, recurrence_type, formattedEndDate);
      for (const dateStr of dates) {
        await pool.query(
          'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [title, description, dateStr, from_time, to_time, 1, recurrence_type, formattedEndDate, taskColor, hiddenVal]
        );
      }
      return { message: `Regenerated ${dates.length} tasks with new recurrence pattern` };
    }

    const [result] = await pool.query(
      `UPDATE calendar_tasks SET title = ?, description = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ?, is_hidden = ? ${whereClause}`,
      [title, description, from_time, to_time, is_recurring || 0, recurrence_type || 'none', formattedEndDate, taskColor, hiddenVal, ...params]
    );
    return { affectedRows: result.affectedRows };
  }

  await pool.query(
    'UPDATE calendar_tasks SET title = ?, description = ?, task_date = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ?, is_hidden = ? WHERE id = ?',
    [title, description, task_date, from_time, to_time, is_recurring || 0, recurrence_type || 'none', formattedEndDate, taskColor, hiddenVal, id]
  );
  return { affectedRows: 1 };
};

module.exports = {
  fetchCalendarTasks,
  createCalendarTask,
  deleteCalendarTask,
  updateCalendarTask
};
