const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = 3001;

const parseLocalDate = (value) => {
  if (!value) return null;

  const dateString = typeof value === 'string' && value.includes('T') ? value.split('T')[0] : value;
  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day);
};

app.use(cors());
app.use(express.json());

// MySQL connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'my_day',
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create MySQL connection pool (without database initially)
const poolWithoutDB = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  connectionLimit: 3,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Create MySQL connection pool (with database) - will be initialized after DB setup
let pool = null;

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await poolWithoutDB.getConnection();
    await connection.ping();
    connection.release();
    res.json({ success: true, message: 'MySQL connection successful' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, message: 'MySQL connection failed', error: error.message });
  }
});

// Create database if it doesn't exist
app.get('/api/setup-database', async (req, res) => {
  try {
    if (pool) {
      return res.json({ success: true, message: 'Database already initialized' });
    }
    
    const connection = await poolWithoutDB.getConnection();
    
    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS my_day');
    
    connection.release();
    
    // Create pool with database
    pool = mysql.createPool(dbConfig);

    console.log('Database initialized successfully');
    
    // Create calendar tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        task_date DATE NOT NULL,
        from_time TIME NOT NULL,
        to_time TIME NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_type VARCHAR(20) DEFAULT 'none',
        recurrence_end_date DATE NULL,
        parent_task_id INT NULL,
        color VARCHAR(7) DEFAULT '#e3f2fd',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if table already exists (MySQL-compatible approach)
    try {
      await pool.query('ALTER TABLE calendar_tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE');
    } catch (error) {
      if (!error.message.includes('Duplicate column')) {
        console.log('Error adding is_recurring column:', error.message);
      }
    }
    try {
      await pool.query('ALTER TABLE calendar_tasks ADD COLUMN recurrence_type VARCHAR(20) DEFAULT "none"');
    } catch (error) {
      if (!error.message.includes('Duplicate column')) {
        console.log('Error adding recurrence_type column:', error.message);
      }
    }
    try {
      await pool.query('ALTER TABLE calendar_tasks ADD COLUMN recurrence_end_date DATE NULL');
    } catch (error) {
      if (!error.message.includes('Duplicate column')) {
        console.log('Error adding recurrence_end_date column:', error.message);
      }
    }
    try {
      await pool.query('ALTER TABLE calendar_tasks ADD COLUMN parent_task_id INT NULL');
    } catch (error) {
      if (!error.message.includes('Duplicate column')) {
        console.log('Error adding parent_task_id column:', error.message);
      }
    }
    try {
      await pool.query('ALTER TABLE calendar_tasks ADD COLUMN color VARCHAR(7) DEFAULT "#e3f2fd"');
    } catch (error) {
      if (!error.message.includes('Duplicate column')) {
        console.log('Error adding color column:', error.message);
      }
    }
    // Create todo items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todo_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ success: true, message: 'Database setup completed' });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ success: false, message: 'Database setup failed', error: error.message });
  }
});

// Get tasks for a specific date range
app.get('/api/calendar-tasks', async (req, res) => {
  try {
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
    res.json({ success: true, tasks: rows });
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    res.status(500).json({ success: false, message: 'Error fetching calendar tasks', error: error.message });
  }
});

// Alias endpoint for tasks (same as calendar-tasks)
app.get('/api/tasks', async (req, res) => {
  try {
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
    res.json({ success: true, tasks: rows });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
  }
});

// Add a new calendar task
app.post('/api/calendar-tasks', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    
    const { title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color } = req.body;

    // Convert recurrence_end_date to proper format (YYYY-MM-DD) if provided
    const formattedRecurrenceEndDate = recurrence_end_date
      ? (recurrence_end_date.includes('T') ? recurrence_end_date.split('T')[0] : recurrence_end_date)
      : null;

    console.log('Creating task with:', { title, is_recurring, recurrence_type, recurrence_end_date: formattedRecurrenceEndDate });
    
    if (is_recurring && recurrence_type && recurrence_type !== 'none') {
      console.log('Creating recurring tasks with type:', recurrence_type);
      // Create recurring tasks
      const createdTasks = [];
      const endDate = formattedRecurrenceEndDate ? parseLocalDate(formattedRecurrenceEndDate) : new Date();

      // Only add 12 months if no end date is provided
      if (!formattedRecurrenceEndDate) {
        endDate.setMonth(endDate.getMonth() + 12); // Default to 1 year from now if no end date
      }

      console.log('End date for recurrence:', endDate.toISOString().split('T')[0]);

      let currentDate = parseLocalDate(task_date);
      const maxTasks = 365; // Safety limit to prevent infinite loops
      let taskCount = 0;

      while (currentDate <= endDate && taskCount < maxTasks) {
        console.log(`Creating task ${taskCount + 1} for date:`, currentDate.toISOString().split('T')[0]);
        const [result] = await pool.query(
          'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [title, description, currentDate.toISOString().split('T')[0], from_time, to_time, 1, recurrence_type, formattedRecurrenceEndDate, color || '#e3f2fd']
        );
        createdTasks.push({ id: result.insertId, date: currentDate.toISOString().split('T')[0] });
        taskCount++;
        
        // Move to next occurrence based on recurrence type
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
      
      console.log(`Created ${taskCount} recurring tasks`);
      res.json({ success: true, tasks: createdTasks, message: `Created ${taskCount} recurring tasks` });
    } else {
      console.log('Creating single task');
      // Create single task
      const [result] = await pool.query(
        'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, description, task_date, from_time, to_time, 0, 'none', color || '#e3f2fd']
      );
      res.json({ success: true, id: result.insertId });
    }
  } catch (error) {
    console.error('Error adding calendar task:', error);
    res.status(500).json({ success: false, message: 'Error adding calendar task', error: error.message });
  }
});

// Delete a calendar task
app.delete('/api/calendar-tasks/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    
    const { id } = req.params;
    const { mode } = req.query;
    
    console.log('Deleting task:', id, 'with mode:', mode);
    
    if (mode === 'single' || !mode) {
      // Delete single task
      await pool.query('DELETE FROM calendar_tasks WHERE id = ?', [id]);
      res.json({ success: true, message: 'Task deleted successfully' });
    } else if (mode === 'all' || mode === 'future') {
      // Get the current task to find matching tasks
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
app.put('/api/calendar-tasks/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    
    const { id } = req.params;
    const { title, description, task_date, from_time, to_time, editMode, is_recurring, recurrence_type, recurrence_end_date, color } = req.body;

    // Convert recurrence_end_date to proper format (YYYY-MM-DD) if provided
    const formattedRecurrenceEndDate = recurrence_end_date
      ? (recurrence_end_date.includes('T') ? recurrence_end_date.split('T')[0] : recurrence_end_date)
      : null;

    console.log('Updating task:', id, 'with editMode:', editMode, 'is_recurring:', is_recurring, 'recurrence_type:', recurrence_type);
    
    if (editMode === 'single') {
      // Update only this instance
      const [result] = await pool.query(
        'UPDATE calendar_tasks SET title = ?, description = ?, task_date = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ? WHERE id = ?',
        [title, description, task_date, from_time, to_time, is_recurring || 0, recurrence_type || 'none', formattedRecurrenceEndDate, color || '#e3f2fd', id]
      );
      res.json({ success: true, message: 'Task updated successfully' });
    } else if (editMode === 'all' || editMode === 'future') {
      // First get the current task to find matching tasks
      const [currentTask] = await pool.query('SELECT * FROM calendar_tasks WHERE id = ?', [id]);
      
      if (currentTask.length === 0) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      
      const task = currentTask[0];
      
      // If recurrence pattern changed, we need to regenerate the series
      if (task.is_recurring && is_recurring && task.recurrence_type !== recurrence_type) {
        console.log('Recurrence type changed, regenerating series');
        
        // Delete existing matching tasks
        let whereClause = 'WHERE title = ? AND description = ?';
        let params = [task.title, task.description];
        
        if (editMode === 'future') {
          whereClause += ' AND task_date >= ?';
          params.push(task.task_date);
        }
        
        await pool.query(`DELETE FROM calendar_tasks ${whereClause}`, params);
        
        // Create new recurring series with new pattern
        const createdTasks = [];
        const endDate = recurrence_end_date ? parseLocalDate(recurrence_end_date) : new Date();
        
        // Only add 12 months if no end date is provided
        if (!recurrence_end_date) {
          endDate.setMonth(endDate.getMonth() + 12);
        }
        
        let currentDate = parseLocalDate(task_date);
        const maxTasks = 365;
        let taskCount = 0;
        
        while (currentDate <= endDate && taskCount < maxTasks) {
          const [result] = await pool.query(
            'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, currentDate.toISOString().split('T')[0], from_time, to_time, 1, recurrence_type, recurrence_end_date, color || '#e3f2fd']
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
        // Just update existing tasks
        let whereClause = 'WHERE title = ? AND description = ?';
        let params = [task.title, task.description];
        
        if (editMode === 'future') {
          whereClause += ' AND task_date >= ?';
          params.push(task.task_date);
        }
        
        const [result] = await pool.query(
          `UPDATE calendar_tasks SET title = ?, description = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ? ${whereClause}`,
          [title, description, from_time, to_time, is_recurring || 0, recurrence_type || 'none', recurrence_end_date || null, color || '#e3f2fd', ...params]
        );
        
        res.json({ success: true, message: `Updated ${result.affectedRows} task instances` });
      }
    } else {
      // Default: single update
      const [result] = await pool.query(
        'UPDATE calendar_tasks SET title = ?, description = ?, task_date = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ? WHERE id = ?',
        [title, description, task_date, from_time, to_time, is_recurring || 0, recurrence_type || 'none', recurrence_end_date || null, color || '#e3f2fd', id]
      );
      res.json({ success: true, message: 'Task updated successfully' });
    }
  } catch (error) {
    console.error('Error updating calendar task:', error);
    res.status(500).json({ success: false, message: 'Error updating calendar task', error: error.message });
  }
});

// Get all todo items
app.get('/api/todo-items', async (req, res) => {
  try {
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
app.post('/api/todo-items', async (req, res) => {
  try {
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

// Toggle todo item completion
app.put('/api/todo-items/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    
    const { id } = req.params;
    const { completed, title } = req.body;
    
    console.log('Updating todo item:', id, 'body:', req.body);
    
    if (title !== undefined) {
      // Update title
      console.log('Updating title to:', title);
      const [result] = await pool.query('UPDATE todo_items SET title = ? WHERE id = ?', [title, id]);
      console.log('Update result:', result);
    } else {
      // Update completion status
      console.log('Updating completed to:', completed);
      const [result] = await pool.query('UPDATE todo_items SET completed = ? WHERE id = ?', [completed, id]);
      console.log('Update result:', result);
    }
    
    res.json({ success: true, message: 'Todo item updated successfully' });
  } catch (error) {
    console.error('Error updating todo item:', error);
    res.status(500).json({ success: false, message: 'Error updating todo item', error: error.message });
  }
});

// Delete a todo item
app.delete('/api/todo-items/:id', async (req, res) => {
  try {
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});