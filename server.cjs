const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { extractFromPdfBuffer } = require('./invoiceParser.cjs');
require('dotenv').config();

const app = express();
const port = Number(process.env.API_PORT || 3001);
const databaseName = process.env.DB_NAME || 'my_day';

// Ensure uploads directory exists permanently
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'invoices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  throw new Error('DB_NAME may contain only letters, numbers, and underscores');
}

const formatDateOnly = (value) => {
  if (!value) return '';

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const datePart = trimmed.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }

  return String(value).slice(0, 10);
};

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'aX$Eq16k',
  database: databaseName,
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true
};

// Create MySQL connection pool (without database initially)
const poolWithoutDB = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  connectionLimit: 3,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true
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

// Ensure JivanDisha locations and invoices tables exist
const ensureJivanDishaTable = async () => {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jivandisha_locations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      country VARCHAR(10) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) DEFAULT 'General',
      lat DECIMAL(10, 7) NOT NULL,
      lng DECIMAL(10, 7) NOT NULL,
      city VARCHAR(100) NULL,
      state VARCHAR(100) NULL,
      address VARCHAR(255) NULL,
      notes TEXT NULL,
      books_sent INT DEFAULT 0,
      invoice_date DATE NULL,
      payment_received BOOLEAN DEFAULT FALSE,
      decision_maker_name VARCHAR(150) NULL,
      decision_maker_phone VARCHAR(50) NULL,
      inventory_keeper_name VARCHAR(150) NULL,
      inventory_keeper_phone VARCHAR(50) NULL,
      invoice_pdf_url VARCHAR(500) NULL,
      invoice_pdf_name VARCHAR(255) NULL,
      contact_person VARCHAR(150) NULL,
      contact_phone VARCHAR(50) NULL,
      contact_email VARCHAR(150) NULL,
      website VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Ensure jivandisha_invoices table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jivandisha_invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      location_id INT NOT NULL,
      invoice_number VARCHAR(100) NULL,
      invoice_date DATE NOT NULL,
      books_sent INT DEFAULT 0,
      amount DECIMAL(10, 2) NULL,
      payment_received BOOLEAN DEFAULT FALSE,
      pdf_url VARCHAR(500) NULL,
      pdf_name VARCHAR(255) NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_location_id (location_id)
    )
  `);

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN books_sent INT DEFAULT 0');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding books_sent column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN invoice_date DATE NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding invoice_date column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN payment_received BOOLEAN DEFAULT FALSE');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding payment_received column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN decision_maker_name VARCHAR(150) NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding decision_maker_name column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN decision_maker_phone VARCHAR(50) NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding decision_maker_phone column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN inventory_keeper_name VARCHAR(150) NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding inventory_keeper_name column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN inventory_keeper_phone VARCHAR(50) NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding inventory_keeper_phone column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN invoice_pdf_url VARCHAR(500) NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding invoice_pdf_url column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_locations ADD COLUMN invoice_pdf_name VARCHAR(255) NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding invoice_pdf_name column:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_invoices ADD COLUMN pdf_url VARCHAR(500) NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding pdf_url column to invoices:', error.message);
    }
  }

  try {
    await pool.query('ALTER TABLE jivandisha_invoices ADD COLUMN pdf_name VARCHAR(255) NULL');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding pdf_name column to invoices:', error.message);
    }
  }
};

// Set up all database tables and schema migrations
const setupAllTables = async () => {
  if (!pool) return;

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

  // Create health logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS health_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      log_date DATE NOT NULL UNIQUE,
      sleep_time VARCHAR(50) NOT NULL,
      sleep_duration DECIMAL(4,2) NOT NULL,
      workout_time VARCHAR(50) NULL,
      workout_duration DECIMAL(4,2) DEFAULT 0,
      meals JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Create JivanDisha locations & invoices tables
  await ensureJivanDishaTable();
};

// Initialize database connection pool automatically
const initDatabase = async () => {
  if (pool) {
    await ensureJivanDishaTable();
    return pool;
  }

  try {
    const connection = await poolWithoutDB.getConnection();
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    connection.release();

    pool = mysql.createPool(dbConfig);
    console.log('MySQL Database pool connected successfully');

    await setupAllTables();
    return pool;
  } catch (error) {
    console.error('MySQL Database auto-initialization error:', error.message);
    return null;
  }
};

// Create database endpoint (for compatibility with existing frontend calls)
app.get('/api/setup-database', async (req, res) => {
  try {
    const currentPool = await initDatabase();
    if (!currentPool) {
      return res.status(500).json({ success: false, message: 'Database setup failed to connect to MySQL' });
    }
    res.json({ success: true, message: 'Database setup completed' });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ success: false, message: 'Database setup failed', error: error.message });
  }
});

// Middleware to ensure database pool is connected on any API request
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/test-connection' && req.path !== '/api/setup-database') {
    if (!pool) {
      await initDatabase();
    }
  }
  next();
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
    const tasks = rows.map(task => ({
      ...task,
      task_date: task.task_date ? String(task.task_date).slice(0, 10) : task.task_date
    }));
    res.json({ success: true, tasks });
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
    const tasks = rows.map(task => ({
      ...task,
      task_date: task.task_date ? String(task.task_date).slice(0, 10) : task.task_date
    }));
    res.json({ success: true, tasks });
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

// Health log endpoints
app.get('/api/health-logs', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const [rows] = await pool.query('SELECT * FROM health_logs ORDER BY log_date ASC');
    const logs = rows.map(log => ({
      id: log.id,
      date: new Date(`${log.log_date}T00:00:00`),
      sleepTime: log.sleep_time,
      sleepDuration: Number(log.sleep_duration),
      workoutTime: log.workout_time,
      workoutDuration: Number(log.workout_duration || 0),
      meals: typeof log.meals === 'string' ? JSON.parse(log.meals) : (log.meals || [])
    }));

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching health logs:', error);
    res.status(500).json({ success: false, message: 'Error fetching health logs', error: error.message });
  }
});

app.post('/api/health-logs', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { date, sleepTime, sleepDuration, workoutTime, workoutDuration, meals } = req.body;
    const logDate = formatDateOnly(date);

    if (!logDate) {
      return res.status(400).json({ success: false, message: 'Health log date is required' });
    }

    const payloadMeals = Array.isArray(meals) ? meals : [];

    await pool.query(`
      INSERT INTO health_logs (log_date, sleep_time, sleep_duration, workout_time, workout_duration, meals)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sleep_time = VALUES(sleep_time),
        sleep_duration = VALUES(sleep_duration),
        workout_time = VALUES(workout_time),
        workout_duration = VALUES(workout_duration),
        meals = VALUES(meals),
        updated_at = CURRENT_TIMESTAMP
    `, [
      logDate,
      sleepTime,
      Number(sleepDuration || 0),
      workoutTime || null,
      Number(workoutDuration || 0),
      JSON.stringify(payloadMeals)
    ]);

    const [rows] = await pool.query('SELECT * FROM health_logs WHERE log_date = ?', [logDate]);
    const savedLog = rows[0];

    res.json({
      success: true,
      log: {
        id: savedLog.id,
        date: new Date(`${savedLog.log_date}T00:00:00`),
        sleepTime: savedLog.sleep_time,
        sleepDuration: Number(savedLog.sleep_duration),
        workoutTime: savedLog.workout_time,
        workoutDuration: Number(savedLog.workout_duration || 0),
        meals: typeof savedLog.meals === 'string' ? JSON.parse(savedLog.meals) : (savedLog.meals || [])
      }
    });
  } catch (error) {
    console.error('Error saving health log:', error);
    res.status(500).json({ success: false, message: 'Error saving health log', error: error.message });
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

// ==================== JIVANDISHA LOCATIONS API ====================

// Get all JivanDisha locations (optional filter: ?country=IN or ?country=US)
app.get('/api/jivandisha/locations', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { country } = req.query;
    let query = 'SELECT * FROM jivandisha_locations';
    const params = [];
    if (country) {
      query += ' WHERE country = ?';
      params.push(country.toUpperCase());
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    const locations = rows.map(loc => ({
      ...loc,
      lat: parseFloat(loc.lat),
      lng: parseFloat(loc.lng),
      books_sent: Number(loc.books_sent || 0),
      invoice_date: loc.invoice_date ? String(loc.invoice_date).slice(0, 10) : '',
      payment_received: Boolean(loc.payment_received),
      decision_maker_name: loc.decision_maker_name || '',
      decision_maker_phone: loc.decision_maker_phone || '',
      inventory_keeper_name: loc.inventory_keeper_name || '',
      inventory_keeper_phone: loc.inventory_keeper_phone || '',
      invoice_pdf_url: loc.invoice_pdf_url || '',
      invoice_pdf_name: loc.invoice_pdf_name || ''
    }));
    res.json({ success: true, locations });
  } catch (error) {
    console.error('Error fetching JivanDisha locations:', error);
    res.status(500).json({ success: false, message: 'Error fetching locations', error: error.message });
  }
});

// Add a new JivanDisha location
app.post('/api/jivandisha/locations', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const {
      country = 'IN',
      title,
      category = 'General',
      lat,
      lng,
      city = '',
      state = '',
      address = '',
      notes = '',
      books_sent = 0,
      invoice_date = null,
      payment_received = false,
      decision_maker_name = '',
      decision_maker_phone = '',
      inventory_keeper_name = '',
      inventory_keeper_phone = '',
      invoice_pdf_url = '',
      invoice_pdf_name = '',
      contact_person = '',
      contact_phone = '',
      contact_email = '',
      website = '',
      invoice_number = '',
      amount = null
    } = req.body;

    if (!title || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Title, latitude, and longitude are required' });
    }

    const sanitizedBooksSent = parseInt(books_sent, 10) || 0;
    const sanitizedInvoiceDate = invoice_date && invoice_date.trim() ? invoice_date.trim().slice(0, 10) : null;
    const sanitizedPaymentReceived = Boolean(payment_received);

    const [result] = await pool.query(
      `INSERT INTO jivandisha_locations 
       (country, title, category, lat, lng, city, state, address, notes, books_sent, invoice_date, payment_received, decision_maker_name, decision_maker_phone, inventory_keeper_name, inventory_keeper_phone, invoice_pdf_url, invoice_pdf_name, contact_person, contact_phone, contact_email, website)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        country.toUpperCase(),
        title,
        category,
        lat,
        lng,
        city,
        state,
        address,
        notes,
        sanitizedBooksSent,
        sanitizedInvoiceDate,
        sanitizedPaymentReceived,
        decision_maker_name,
        decision_maker_phone,
        inventory_keeper_name,
        inventory_keeper_phone,
        invoice_pdf_url,
        invoice_pdf_name,
        contact_person,
        contact_phone,
        contact_email,
        website
      ]
    );

    const newLocationId = result.insertId;

    // If initial invoice or books were provided, also record in jivandisha_invoices table
    if (sanitizedInvoiceDate || sanitizedBooksSent > 0 || invoice_pdf_url) {
      try {
        await pool.query(
          `INSERT INTO jivandisha_invoices (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newLocationId,
            invoice_number || 'Initial Shipment',
            sanitizedInvoiceDate || new Date().toISOString().slice(0, 10),
            sanitizedBooksSent,
            amount ? parseFloat(amount) : null,
            sanitizedPaymentReceived,
            invoice_pdf_url,
            invoice_pdf_name,
            notes ? notes.slice(0, 255) : 'Initial location setup entry'
          ]
        );
      } catch (invErr) {
        console.error('Error inserting initial invoice:', invErr);
      }
    }

    res.json({
      success: true,
      id: newLocationId,
      location: {
        id: newLocationId,
        country: country.toUpperCase(),
        title,
        category,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        city,
        state,
        address,
        notes,
        books_sent: sanitizedBooksSent,
        invoice_date: sanitizedInvoiceDate || '',
        payment_received: sanitizedPaymentReceived,
        decision_maker_name,
        decision_maker_phone,
        inventory_keeper_name,
        inventory_keeper_phone,
        invoice_pdf_url,
        invoice_pdf_name,
        contact_person,
        contact_phone,
        contact_email,
        website
      }
    });
  } catch (error) {
    console.error('Error adding JivanDisha location:', error);
    res.status(500).json({ success: false, message: 'Error adding location', error: error.message });
  }
});

// Update an existing JivanDisha location
app.put('/api/jivandisha/locations/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    const {
      country,
      title,
      category,
      lat,
      lng,
      city,
      state,
      address,
      notes,
      books_sent,
      invoice_date,
      payment_received,
      decision_maker_name,
      decision_maker_phone,
      inventory_keeper_name,
      inventory_keeper_phone,
      invoice_pdf_url,
      invoice_pdf_name,
      contact_person,
      contact_phone,
      contact_email,
      website
    } = req.body;

    const sanitizedBooksSent = books_sent !== undefined ? (parseInt(books_sent, 10) || 0) : null;
    const sanitizedInvoiceDate = invoice_date !== undefined ? (invoice_date && invoice_date.trim() ? invoice_date.trim().slice(0, 10) : null) : null;
    const sanitizedPaymentReceived = payment_received !== undefined ? Boolean(payment_received) : null;

    await pool.query(
      `UPDATE jivandisha_locations SET 
       country = COALESCE(?, country),
       title = COALESCE(?, title),
       category = COALESCE(?, category),
       lat = COALESCE(?, lat),
       lng = COALESCE(?, lng),
       city = COALESCE(?, city),
       state = COALESCE(?, state),
       address = COALESCE(?, address),
       notes = COALESCE(?, notes),
       books_sent = CASE WHEN ? IS NOT NULL THEN ? ELSE books_sent END,
       invoice_date = CASE WHEN ? IS NOT NULL THEN ? ELSE invoice_date END,
       payment_received = CASE WHEN ? IS NOT NULL THEN ? ELSE payment_received END,
       decision_maker_name = COALESCE(?, decision_maker_name),
       decision_maker_phone = COALESCE(?, decision_maker_phone),
       inventory_keeper_name = COALESCE(?, inventory_keeper_name),
       inventory_keeper_phone = COALESCE(?, inventory_keeper_phone),
       invoice_pdf_url = COALESCE(?, invoice_pdf_url),
       invoice_pdf_name = COALESCE(?, invoice_pdf_name),
       contact_person = COALESCE(?, contact_person),
       contact_phone = COALESCE(?, contact_phone),
       contact_email = COALESCE(?, contact_email),
       website = COALESCE(?, website)
       WHERE id = ?`,
      [
        country ? country.toUpperCase() : null,
        title,
        category,
        lat,
        lng,
        city,
        state,
        address,
        notes,
        sanitizedBooksSent !== null ? 1 : null,
        sanitizedBooksSent,
        invoice_date !== undefined ? 1 : null,
        sanitizedInvoiceDate,
        payment_received !== undefined ? 1 : null,
        sanitizedPaymentReceived,
        decision_maker_name,
        decision_maker_phone,
        inventory_keeper_name,
        inventory_keeper_phone,
        invoice_pdf_url,
        invoice_pdf_name,
        contact_person,
        contact_phone,
        contact_email,
        website,
        id
      ]
    );

    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating JivanDisha location:', error);
    res.status(500).json({ success: false, message: 'Error updating location', error: error.message });
  }
});

// Delete a JivanDisha location and its invoices
app.delete('/api/jivandisha/locations/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    await pool.query('DELETE FROM jivandisha_invoices WHERE location_id = ?', [id]);
    await pool.query('DELETE FROM jivandisha_locations WHERE id = ?', [id]);
    res.json({ success: true, message: 'Location and history deleted successfully' });
  } catch (error) {
    console.error('Error deleting JivanDisha location:', error);
    res.status(500).json({ success: false, message: 'Error deleting location', error: error.message });
  }
});

// ==================== JIVANDISHA PDF UPLOAD & PARSER API ====================

// Upload and parse an invoice PDF
app.post('/api/jivandisha/upload-invoice-pdf', express.raw({ type: 'application/pdf', limit: '50mb' }), async (req, res) => {
  try {
    const isBinaryUpload = Buffer.isBuffer(req.body);
    const filename = isBinaryUpload
      ? decodeURIComponent(req.get('x-file-name') || 'invoice.pdf')
      : req.body?.filename || 'invoice.pdf';
    const country = isBinaryUpload ? (req.get('x-country') || 'IN') : (req.body?.country || 'IN');
    let buffer;

    if (isBinaryUpload) {
      buffer = req.body;
    } else if (req.body?.fileBase64) {
      const rawBase64 = req.body.fileBase64.includes('base64,')
        ? req.body.fileBase64.split('base64,')[1]
        : req.body.fileBase64;
      buffer = Buffer.from(rawBase64, 'base64');
    } else {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }

    if (buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'Empty file buffer' });
    }

    // Clean filename and generate a unique storage name
    const ext = '.pdf';
    const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const savedName = `${Date.now()}_${baseName}${ext}`;
    const targetPath = path.join(uploadsDir, savedName);

    // Save permanently to disk
    await fs.promises.writeFile(targetPath, buffer);
    const pdfUrl = `/uploads/invoices/${savedName}`;

    // Extract values from PDF buffer (dynamically reloaded to prevent stale cache)
    let parser;
    try {
      delete require.cache[require.resolve('./invoiceParser.cjs')];
      parser = require('./invoiceParser.cjs');
    } catch (requireErr) {
      console.warn('Failed to dynamically require invoiceParser:', requireErr.message);
      parser = { extractFromPdfBuffer };
    }

    const parseResult = await parser.extractFromPdfBuffer(buffer, country);
    console.log(`[JivanDisha] PDF "${filename}" uploaded (${buffer.length} bytes). Extraction success: ${parseResult.success}`);
    if (parseResult.success) {
      console.log('[JivanDisha] Extracted details:', JSON.stringify(parseResult.data));
    } else {
      console.error('[JivanDisha] Parser error:', parseResult.error);
    }

    if (!parseResult.success) {
      return res.status(200).json({
        success: false,
        pdfUrl,
        pdfFilename: filename,
        message: parseResult.error || 'Failed to extract values from PDF',
        parseError: parseResult.error
      });
    }

    res.json({
      success: true,
      pdfUrl,
      pdfFilename: filename,
      extracted: parseResult.data,
      rawPreview: parseResult.rawText || ''
    });
  } catch (error) {
    console.error('Error uploading/parsing invoice PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to process invoice PDF', error: error.message });
  }
});

// ==================== JIVANDISHA INVOICES API ====================

// Get all past invoices for a location
app.get('/api/jivandisha/locations/:id/invoices', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM jivandisha_invoices WHERE location_id = ? ORDER BY invoice_date DESC, id DESC',
      [id]
    );

    const invoices = rows.map(inv => ({
      ...inv,
      invoice_date: inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '',
      books_sent: Number(inv.books_sent || 0),
      amount: inv.amount ? parseFloat(inv.amount) : null,
      payment_received: Boolean(inv.payment_received),
      pdf_url: inv.pdf_url || '',
      pdf_name: inv.pdf_name || ''
    }));

    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices for location:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices', error: error.message });
  }
});

// Add a new invoice for a location
app.post('/api/jivandisha/locations/:id/invoices', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    const {
      invoice_number = '',
      invoice_date = new Date().toISOString().slice(0, 10),
      books_sent = 0,
      amount = null,
      payment_received = false,
      pdf_url = '',
      pdf_name = '',
      notes = ''
    } = req.body;

    const sanitizedBooks = parseInt(books_sent, 10) || 0;
    const sanitizedDate = invoice_date && invoice_date.trim() ? invoice_date.trim().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const sanitizedPayment = Boolean(payment_received);
    const sanitizedAmount = amount ? parseFloat(amount) : null;

    const [result] = await pool.query(
      `INSERT INTO jivandisha_invoices 
       (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, invoice_number, sanitizedDate, sanitizedBooks, sanitizedAmount, sanitizedPayment, pdf_url, pdf_name, notes]
    );

    // Update location total books_sent and latest invoice_date
    const [sumRows] = await pool.query(
      'SELECT SUM(books_sent) as total_books FROM jivandisha_invoices WHERE location_id = ?',
      [id]
    );
    const totalBooks = sumRows[0]?.total_books || sanitizedBooks;
    await pool.query(
      'UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?',
      [totalBooks, sanitizedDate, id]
    );

    res.json({
      success: true,
      id: result.insertId,
      invoice: {
        id: result.insertId,
        location_id: Number(id),
        invoice_number,
        invoice_date: sanitizedDate,
        books_sent: sanitizedBooks,
        amount: sanitizedAmount,
        payment_received: sanitizedPayment,
        pdf_url,
        pdf_name,
        notes
      }
    });
  } catch (error) {
    console.error('Error adding invoice:', error);
    res.status(500).json({ success: false, message: 'Error adding invoice', error: error.message });
  }
});

// Update an invoice (e.g. toggle payment_received, edit details)
app.put('/api/jivandisha/invoices/:invoiceId', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { invoiceId } = req.params;
    const {
      invoice_number,
      invoice_date,
      books_sent,
      amount,
      payment_received,
      pdf_url,
      pdf_name,
      notes
    } = req.body;

    await pool.query(
      `UPDATE jivandisha_invoices SET 
       invoice_number = COALESCE(?, invoice_number),
       invoice_date = COALESCE(?, invoice_date),
       books_sent = COALESCE(?, books_sent),
       amount = COALESCE(?, amount),
       payment_received = CASE WHEN ? IS NOT NULL THEN ? ELSE payment_received END,
       pdf_url = COALESCE(?, pdf_url),
       pdf_name = COALESCE(?, pdf_name),
       notes = COALESCE(?, notes)
       WHERE id = ?`,
      [
        invoice_number,
        invoice_date ? invoice_date.slice(0, 10) : null,
        books_sent !== undefined ? parseInt(books_sent, 10) : null,
        amount !== undefined ? parseFloat(amount) : null,
        payment_received !== undefined ? 1 : null,
        payment_received !== undefined ? Boolean(payment_received) : null,
        pdf_url,
        pdf_name,
        notes,
        invoiceId
      ]
    );

    res.json({ success: true, message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, message: 'Error updating invoice', error: error.message });
  }
});

// Delete an invoice
app.delete('/api/jivandisha/invoices/:invoiceId', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { invoiceId } = req.params;
    await pool.query('DELETE FROM jivandisha_invoices WHERE id = ?', [invoiceId]);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: 'Error deleting invoice', error: error.message });
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.too.large' || error.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Request too large. Invoice PDF uploads are limited to 50 MB.'
    });
  }

  console.error('Unhandled API error:', error);
  res.status(error.status || 500).json({ success: false, message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  initDatabase().catch(err => {
    console.error('Initial database connection warning:', err.message);
  });
});