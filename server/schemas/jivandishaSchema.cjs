async function ensureJivanDishaTable(pool) {
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
    } catch (e) {}
  }

  const invColumns = [
    'pdf_url VARCHAR(500) NULL',
    'pdf_name VARCHAR(255) NULL'
  ];

  for (const col of invColumns) {
    try {
      await pool.query(`ALTER TABLE jivandisha_invoices ADD COLUMN ${col}`);
    } catch (e) {}
  }

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
    } catch (e) {}
  }
}

module.exports = { ensureJivanDishaTable };
