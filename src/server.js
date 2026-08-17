/**
 * Server Entry Point
 *
 * Configures the Express application to serve static frontend assets,
 * creates the HTTP server, and attaches the Socket.IO instance.
 *
 * Learning Note:
 * Notice how clean and focused this file is. Instead of cluttering server.js
 * with real-time business logic, we delegate all socket handlers to src/socket/handlers.js.
 */

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { registerSocketHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static assets from the public directory
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Attach real-time event handlers
registerSocketHandlers(io);

const PORT = process.env.PORT || 3000;

// Start HTTP server if this module is run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`
  ===========================================
    Chatter Server is running!
    URL: http://localhost:${PORT}
    Environment: ${process.env.NODE_ENV || 'development'}
  ===========================================
    `);
  });
}

module.exports = { app, server, io };
