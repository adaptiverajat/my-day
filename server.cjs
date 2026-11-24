const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const {
  poolWithoutDB,
  getPool,
  initDatabase,
  setupAllTables
} = require('./server/db.cjs');

// Import modular routers
const tasksRouter = require('./server/routes/tasks.cjs');
const healthRouter = require('./server/routes/health.cjs');
const jivandishaRouter = require('./server/routes/jivandisha.cjs');
const userRouter = require('./server/routes/user.cjs');
const financesRouter = require('./server/routes/finances.cjs');
const workRouter = require('./server/routes/work.cjs');
const lecturesRouter = require('./server/routes/lectures.cjs');

const app = express();
const port = Number(process.env.API_PORT || 3001);

// Ensure uploads directory exists permanently
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'invoices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

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

// Setup database endpoint
app.get('/api/setup-database', async (req, res) => {
  try {
    const currentPool = await initDatabase();
    if (!currentPool) {
      return res.status(500).json({ success: false, message: 'Database setup failed to connect to MySQL' });
    }
    await setupAllTables();
    res.json({ success: true, message: 'Database setup completed' });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ success: false, message: 'Database setup failed', error: error.message });
  }
});

// Ensure database pool is connected on any API request
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/test-connection' && req.path !== '/api/setup-database') {
    if (!getPool()) {
      await initDatabase();
    }
  }
  next();
});

// Mount modular API routers
app.use('/api', tasksRouter);
app.use('/api', healthRouter);
app.use('/api/jivandisha', jivandishaRouter);
app.use('/api', userRouter);
app.use('/api/finances', financesRouter);
app.use('/api/work', workRouter);
app.use('/api/lectures', lecturesRouter);

// Global error handler
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

// Start Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  initDatabase().catch(err => {
    console.error('Initial database connection warning:', err.message);
  });
});