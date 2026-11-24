const mysql = require('mysql2/promise');
require('dotenv').config();

const databaseName = process.env.DB_NAME || 'my_day';

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

// Create MySQL connection pool (with database)
let pool = null;

const getPool = () => pool;

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

  const locColumns = [
    'books_sent INT DEFAULT 0',
    'invoice_date DATE NULL',
    'payment_received BOOLEAN DEFAULT FALSE',
    'decision_maker_name VARCHAR(150) NULL',
    'decision_maker_phone VARCHAR(50) NULL',
    'inventory_keeper_name VARCHAR(150) NULL',
    'inventory_keeper_phone VARCHAR(50) NULL',
    'invoice_pdf_url VARCHAR(500) NULL',
    'invoice_pdf_name VARCHAR(255) NULL',
    'next_follow_up_date DATE NULL',
    'remarks TEXT NULL'
  ];

  for (const col of locColumns) {
    try {
      await pool.query(`ALTER TABLE jivandisha_locations ADD COLUMN ${col}`);
    } catch (e) {
      // Ignore Duplicate column errors
    }
  }

  const invColumns = [
    'pdf_url VARCHAR(500) NULL',
    'pdf_name VARCHAR(255) NULL'
  ];

  for (const col of invColumns) {
    try {
      await pool.query(`ALTER TABLE jivandisha_invoices ADD COLUMN ${col}`);
    } catch (e) {
      // Ignore Duplicate column errors
    }
  }

  // Ensure jivandisha_individual_collections table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jivandisha_individual_collections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      individual_name VARCHAR(255) NOT NULL,
      count INT DEFAULT 0,
      date DATE NULL,
      cost DECIMAL(10, 2) DEFAULT 0.00,
      collection DECIMAL(10, 2) DEFAULT 0.00,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_indiv_date (date),
      INDEX idx_indiv_name (individual_name)
    )
  `);

  const indivCols = [
    'count INT DEFAULT 0',
    'date DATE NULL',
    'cost DECIMAL(10, 2) DEFAULT 0.00',
    'collection DECIMAL(10, 2) DEFAULT 0.00',
    'notes TEXT NULL'
  ];

  for (const col of indivCols) {
    try {
      await pool.query(`ALTER TABLE jivandisha_individual_collections ADD COLUMN ${col}`);
    } catch (e) {
      // Ignore Duplicate column errors
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

  const taskCols = [
    'is_recurring BOOLEAN DEFAULT FALSE',
    'recurrence_type VARCHAR(20) DEFAULT "none"',
    'recurrence_end_date DATE NULL',
    'parent_task_id INT NULL',
    'color VARCHAR(7) DEFAULT "#e3f2fd"',
    'is_hidden BOOLEAN DEFAULT FALSE'
  ];
  for (const col of taskCols) {
    try {
      await pool.query(`ALTER TABLE calendar_tasks ADD COLUMN ${col}`);
    } catch (e) {}
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

  // Create user credentials table
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

  // Create finances income items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finances_income_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      month_id INT NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT 'Salary',
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create finances assets table
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

  const assetCols = [
    'excluded BOOLEAN DEFAULT FALSE',
    'percent DECIMAL(5,2) DEFAULT NULL',
    'sort_order INT DEFAULT 0',
    'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  ];
  for (const col of assetCols) {
    try {
      await pool.query(`ALTER TABLE finances_assets ADD COLUMN ${col}`);
    } catch (e) {}
  }

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

  // Create JivanDisha locations & invoices tables
  await ensureJivanDishaTable();

  // Create lectures hearing schedule table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lectures (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lecture_id VARCHAR(100) NULL,
      title VARCHAR(500) NOT NULL,
      year VARCHAR(50) NULL,
      duration VARCHAR(50) NULL,
      duration_seconds INT DEFAULT 0,
      section_no VARCHAR(100) NULL,
      section VARCHAR(255) NULL,
      sub_section VARCHAR(255) NULL,
      status VARCHAR(50) DEFAULT 'pending',
      scheduled_date DATE NULL,
      completed_date DATE NULL,
      notes TEXT NULL,
      transcript LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_lec_section (section),
      INDEX idx_lec_year (year),
      INDEX idx_lec_status (status)
    )
  `);

  const lectureCols = [
    'lecture_id VARCHAR(100) NULL',
    'title VARCHAR(500) NOT NULL',
    'year VARCHAR(50) NULL',
    'duration VARCHAR(50) NULL',
    'duration_seconds INT DEFAULT 0',
    'section_no VARCHAR(100) NULL',
    'section VARCHAR(255) NULL',
    'sub_section VARCHAR(255) NULL',
    'status VARCHAR(50) DEFAULT "pending"',
    'scheduled_date DATE NULL',
    'completed_date DATE NULL',
    'notes TEXT NULL',
    'transcript LONGTEXT NULL'
  ];

  for (const col of lectureCols) {
    try {
      await pool.query(`ALTER TABLE lectures ADD COLUMN ${col}`);
    } catch (e) {}
  }
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

module.exports = {
  dbConfig,
  databaseName,
  poolWithoutDB,
  getPool,
  initDatabase,
  setupAllTables,
  ensureJivanDishaTable,
  formatDateOnly,
  parseLocalDate
};
