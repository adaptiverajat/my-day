async function setupFinancesAndWorkTables(pool) {
  if (!pool) return;

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS finances_known_expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      month_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS finances_unpredictable_expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      month_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS finances_invested_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      month_id INT NOT NULL,
      type VARCHAR(20) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS finances_income_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      month_id INT NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT 'Salary',
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
}

module.exports = { setupFinancesAndWorkTables };
