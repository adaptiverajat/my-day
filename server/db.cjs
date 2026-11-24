const mysql = require('mysql2/promise');
require('dotenv').config();
const { formatDateOnly, parseLocalDate } = require('./dbDateUtils.cjs');
const { ensureJivanDishaTable } = require('./schemas/jivandishaSchema.cjs');
const { setupCoreTables } = require('./schemas/coreTablesSchema.cjs');
const { setupFinancesAndWorkTables } = require('./schemas/financesWorkSchema.cjs');

const databaseName = process.env.DB_NAME || 'my_day';

if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  throw new Error('DB_NAME may contain only letters, numbers, and underscores');
}

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

let pool = null;

const getPool = () => pool;

const setupAllTables = async () => {
  if (!pool) return;
  await setupCoreTables(pool);
  await setupFinancesAndWorkTables(pool);
  await ensureJivanDishaTable(pool);
};

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
  ensureJivanDishaTable: (p) => ensureJivanDishaTable(p || pool),
  formatDateOnly,
  parseLocalDate
};
