/**
 * Socket.IO Connection and Event Handlers
 *
 * Coordinates real-time communication between browser clients and the server.
 * Adheres strictly to the Data Access Layer (src/store/memory.js) and
 * event name constants (src/socket/events.js).
 *
 * Learning Note:
 * Delegating event handling from server.js into a dedicated handlers module
 * keeps the server entry point minimal and makes testing individual event
 * lifecycles much simpler.
 */

const { EVENTS } = require('./events');
const { store } = require('../store/memory');

/**
 * Register all Socket.IO event listeners for incoming connections.
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Handle new user registration (USER_JOIN)
    socket.on(EVENTS.USER_JOIN, (payload, callback) => {
      const ack = typeof callback === 'function' ? callback : () => {};

      if (!payload || typeof payload.username !== 'string') {
        return ack({ error: 'Username must be a valid string' });
      }

      const trimmedUsername = payload.username.trim();

      if (trimmedUsername.length < 1 || trimmedUsername.length > 25) {
        return ack({ error: 'Username must be between 1 and 25 characters' });
      }

      if (store.isUsernameTaken(trimmedUsername, socket.id)) {
        return ack({ error: 'Username is already taken. Please choose another.' });
      }

      try {
        const user = store.addUser({
          id: socket.id,
          username: trimmedUsername,
        });

        // Send initial active users snapshot directly to the joining client
        socket.emit(EVENTS.USERS_LIST, {
          users: store.getAllUsers(),
        });

        // Send recent message history buffer directly to the joining client
        socket.emit(EVENTS.MESSAGE_HISTORY, {
          messages: store.getRecentMessages(50),
        });

        // Broadcast to all clients that a new user has joined with updated roster
        io.emit(EVENTS.USER_JOINED, {
          username: user.username,
          users: store.getAllUsers(),
        });

        return ack({ success: true, user });
      } catch (err) {
        return ack({ error: err.message });
      }
    });

    // Handle incoming chat messages (MESSAGE_SEND)
    socket.on(EVENTS.MESSAGE_SEND, (payload, callback) => {
      const ack = typeof callback === 'function' ? callback : () => {};

      // Ensure sender is registered in the store
      const user = store.getUser(socket.id);
      if (!user) {
        return ack({ error: 'Unauthorized: You must join before sending messages' });
      }

      if (!payload || typeof payload.text !== 'string') {
        return ack({ error: 'Message text must be a valid string' });
      }

      const trimmedText = payload.text.trim();

      if (trimmedText.length < 1 || trimmedText.length > 500) {
        return ack({ error: 'Message must be between 1 and 500 characters' });
      }

      try {
        const savedMessage = store.saveMessage({
          username: user.username,
          text: trimmedText,
        });

        // Broadcast new message to all connected clients
        io.emit(EVENTS.MESSAGE_RECEIVE, savedMessage);

        return ack({ success: true, message: savedMessage });
      } catch (err) {
        return ack({ error: err.message });
      }
    });

    // Handle typing status updates (USER_TYPING)
    socket.on(EVENTS.USER_TYPING, (payload) => {
      // Ensure sender is registered in the store
      const user = store.getUser(socket.id);
      if (!user) {
        return;
      }

      // Validate payload
      if (!payload || typeof payload.isTyping !== 'boolean') {
        return;
      }

      // Broadcast typing state to all clients EXCEPT the sender
      socket.broadcast.emit(EVENTS.USER_TYPING_UPDATE, {
        username: user.username,
        isTyping: payload.isTyping,
      });
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      const removedUser = store.removeUser(socket.id);

      // Only broadcast user:left if the disconnected socket was an active registered user
      if (removedUser) {
        io.emit(EVENTS.USER_LEFT, {
          username: removedUser.username,
          users: store.getAllUsers(),
        });
      }
    });
  });
};

module.exports = { registerSocketHandlers };
