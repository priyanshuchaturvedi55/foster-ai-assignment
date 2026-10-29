const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

let server;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.name, err.message, err.stack);
  process.exit(1);
});

// Boot the server
const startServer = async () => {
  await connectDB();

  server = app.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Foster CRM Server running on port ${env.PORT}`);
    console.log(`📚 Interactive Swagger Docs: http://localhost:${env.PORT}/api/docs`);
    console.log(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`⚙️  Environment: ${env.NODE_ENV}`);
    console.log(`====================================================`);
  });
};

startServer();

// Graceful shutdown helper
const gracefulShutdown = (signal) => {
  console.log(`\n[Process] ${signal} signal received. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] Closed out remaining HTTP connections.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]:', err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

