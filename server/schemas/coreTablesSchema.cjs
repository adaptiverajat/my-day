async function setupCoreTables(pool) {
  if (!pool) return;

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todo_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
}

module.exports = { setupCoreTables };
