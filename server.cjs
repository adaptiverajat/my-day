const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const path = require('path');
const fs = require('fs');
const { extractFromPdfBuffer } = require('./invoiceParser.cjs');
require('dotenv').config();
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');



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
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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'
});

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
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
      is_hidden BOOLEAN DEFAULT FALSE,
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
  try {
    await pool.query('ALTER TABLE calendar_tasks ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE');
  } catch (error) {
    if (!error.message.includes('Duplicate column')) {
      console.log('Error adding is_hidden column:', error.message);
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
    await setupAllTables();
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

    // Create user credentials table for Finances access
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create finances months table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS finances_months (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month VARCHAR(20) NOT NULL,
        year INT NOT NULL,
        income DECIMAL(10,2) DEFAULT 0,
        income_confirmed BOOLEAN DEFAULT FALSE,
        savings DECIMAL(10,2) DEFAULT 0,
        invested_type VARCHAR(20) DEFAULT 'None',
        invested_amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_month_year (month, year)
      )
    `);

    // Create finances known expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS finances_known_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create finances unpredictable expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS finances_unpredictable_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create finances invested transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS finances_invested_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_id INT NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create finances income items table (multiple income sources per month)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS finances_income_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month_id INT NOT NULL,
        name VARCHAR(255) NOT NULL DEFAULT 'Salary',
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS finances_assets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(20) NOT NULL DEFAULT 'movable',
        type VARCHAR(20) NOT NULL DEFAULT 'asset',
        excluded BOOLEAN DEFAULT FALSE,
        percent DECIMAL(5,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create work columns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_columns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#e3f2fd',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create work items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        column_id INT NOT NULL,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (column_id) REFERENCES work_columns(id) ON DELETE CASCADE
      )
    `);

    // Add columns if they don't exist (for existing tables)
    try {
      await pool.query('ALTER TABLE finances_assets ADD COLUMN excluded BOOLEAN DEFAULT FALSE');
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      await pool.query('ALTER TABLE finances_assets ADD COLUMN percent DECIMAL(5,2) DEFAULT NULL');
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      await pool.query('ALTER TABLE finances_assets ADD COLUMN sort_order INT DEFAULT 0');
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      await pool.query('ALTER TABLE finances_assets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    } catch (e) {
      // Column already exists, ignore
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
app.post('/api/calendar-tasks', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    
    const { title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden } = req.body;

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
          'INSERT INTO calendar_tasks (title, description, task_date, from_time, to_time, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [title, description, currentDate.toISOString().split('T')[0], from_time, to_time, 1, recurrence_type, formattedRecurrenceEndDate, color || '#e3f2fd', is_hidden ? 1 : 0]
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
    const { title, description, task_date, from_time, to_time, editMode, is_recurring, recurrence_type, recurrence_end_date, color, is_hidden } = req.body;

    // Convert recurrence_end_date to proper format (YYYY-MM-DD) if provided
    const formattedRecurrenceEndDate = recurrence_end_date
      ? (recurrence_end_date.includes('T') ? recurrence_end_date.split('T')[0] : recurrence_end_date)
      : null;

    console.log('Updating task:', id, 'with editMode:', editMode, 'is_recurring:', is_recurring, 'recurrence_type:', recurrence_type);
    
    const hiddenVal = is_hidden !== undefined ? (is_hidden ? 1 : 0) : 0;

    if (editMode === 'single') {
      // Update only this instance
      const [result] = await pool.query(
        'UPDATE calendar_tasks SET title = ?, description = ?, task_date = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ?, is_hidden = ? WHERE id = ?',
        [title, description, task_date, from_time, to_time, is_recurring || 0, recurrence_type || 'none', formattedRecurrenceEndDate, color || '#e3f2fd', hiddenVal, id]
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
        // Just update existing tasks
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
      // Default: single update
      const [result] = await pool.query(
        'UPDATE calendar_tasks SET title = ?, description = ?, task_date = ?, from_time = ?, to_time = ?, is_recurring = ?, recurrence_type = ?, recurrence_end_date = ?, color = ?, is_hidden = ? WHERE id = ?',
        [title, description, task_date, from_time, to_time, is_recurring || 0, recurrence_type || 'none', recurrence_end_date || null, color || '#e3f2fd', hiddenVal, id]
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

// ==================== USER AUTHENTICATION API ====================

// Check if any user exists in the database
app.get('/api/user/check', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const [rows] = await pool.query('SELECT email FROM user_credentials LIMIT 1');
    const userExists = rows.length > 0;
    res.json({ success: true, userExists, email: userExists ? rows[0].email : null });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ success: false, message: 'Error checking user', error: error.message });
  }
});

// Create a new user
app.post('/api/user/create', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM user_credentials WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user (storing password as plain text for now - in production, use bcrypt)
    await pool.query('INSERT INTO user_credentials (email, password) VALUES (?, ?)', [email, password]);

    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
});

// Login user
app.post('/api/user/login', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check credentials (plain text comparison for now - in production, use bcrypt)
    const [rows] = await pool.query('SELECT id FROM user_credentials WHERE email = ? AND password = ?', [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
});

// ==================== FINANCES API ====================

// Initialize finances data (ensure months exist)
app.get('/api/finances/initialize', async (req, res) => {
  try {
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
app.get('/api/finances', async (req, res) => {
  try {
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

// Parse document (PDF/Excel/text) - placeholder for now
app.post('/api/finances/parse', async (req, res) => {
  try {
    const { fileType, content } = req.body;
    // TODO: Implement actual parsing logic
    res.json({ success: false, message: 'Document parsing not yet implemented' });
  } catch (error) {
    console.error('Error parsing document:', error);
    res.status(500).json({ success: false, message: 'Error parsing document', error: error.message });
  }
});

// Update income for a month
app.post('/api/finances/income', async (req, res) => {
  try {
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
app.post('/api/finances/expenses', async (req, res) => {
  try {
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
app.post('/api/finances/unpredictable-expenses', async (req, res) => {
  try {
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
app.post('/api/finances/invested', async (req, res) => {
  try {
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
app.get('/api/finances/assets', async (req, res) => {
  try {
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
app.post('/api/finances/assets', async (req, res) => {
  try {
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
app.put('/api/finances/assets/:id', async (req, res) => {
  try {
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
app.delete('/api/finances/assets/:id', async (req, res) => {
  try {
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
app.post('/api/finances/assets/reorder', async (req, res) => {
  try {
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

// ==================== WORK API ====================

// Get all work columns
app.get('/api/work/columns', async (req, res) => {
  try {
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
app.post('/api/work/columns', async (req, res) => {
  try {
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
app.put('/api/work/columns/:id', async (req, res) => {
  try {
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
app.delete('/api/work/columns/:id', async (req, res) => {
  try {
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
app.post('/api/work/items', async (req, res) => {
  try {
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
app.put('/api/work/items/:id', async (req, res) => {
  try {
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
app.delete('/api/work/items/:id', async (req, res) => {
  try {
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
app.post('/api/work/columns/reorder', async (req, res) => {
  try {
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