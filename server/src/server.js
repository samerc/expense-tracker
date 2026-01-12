const app = require('./app');
const db = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✓ Database connection verified');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ API base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('✗ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
