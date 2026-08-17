/**
 * Socket.IO Client Module
 *
 * Manages WebSocket connection, event emissions, and inbound event subscriptions.
 * Keeps socket networking logic separate from UI rendering logic.
 */

window.Chatter = window.Chatter || {};

window.Chatter.socket = {
  socket: null,
  currentUser: null,

  /**
   * Initialize Socket.IO connection instance.
   */
  init() {
    if (typeof io !== 'undefined' && !this.socket) {
      this.socket = io();
    }
  },

  /**
   * Request to register username and join the chat room.
   * @param {string} username - User display name
   * @param {Function} callback - Acknowledgment callback
   */
  join(username, callback) {
    if (!this.socket) {
      this.init();
    }

    if (!this.socket) {
      if (typeof callback === 'function') {
        callback({ error: 'Socket connection unavailable' });
      }
      return;
    }

    this.socket.emit('user:join', { username }, (response) => {
      if (response && response.success) {
        this.currentUser = username;
      }
      if (typeof callback === 'function') {
        callback(response);
      }
    });
  },

  /**
   * Send a chat message to the server.
   * @param {string} text - Message text
   * @param {Function} [callback] - Optional acknowledgment callback
   */
  sendMessage(text, callback) {
    if (!this.socket) {
      if (typeof callback === 'function') {
        callback({ error: 'Socket connection unavailable' });
      }
      return;
    }

    this.socket.emit('message:send', { text }, (response) => {
      if (typeof callback === 'function') {
        callback(response);
      }
    });
  },

  /**
   * Subscribe to incoming chat messages.
   * @param {Function} handler - Message event handler
   */
  onMessageReceive(handler) {
    if (!this.socket) this.init();
    if (this.socket && typeof handler === 'function') {
      this.socket.on('message:receive', handler);
    }
  },

  /**
   * Subscribe to new user joined announcements.
   * @param {Function} handler - Join event handler
   */
  onUserJoined(handler) {
    if (!this.socket) this.init();
    if (this.socket && typeof handler === 'function') {
      this.socket.on('user:joined', handler);
    }
  },

  /**
   * Subscribe to user left announcements.
   * @param {Function} handler - Leave event handler
   */
  onUserLeft(handler) {
    if (!this.socket) this.init();
    if (this.socket && typeof handler === 'function') {
      this.socket.on('user:left', handler);
    }
  },
};
