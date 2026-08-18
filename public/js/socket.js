/**
 * Socket.IO Client Module
 *
 * Manages WebSocket connection, event emissions, connection lifecycle tracking,
 * and inbound event subscriptions. Keeps socket networking logic separate from UI rendering logic.
 */

window.Chatter = window.Chatter || {};

window.Chatter.socket = {
  socket: null,
  currentUser: null,
  isConnected: false,
  hasJoined: false,
  isReconnecting: false,

  // Lifecycle subscriber lists
  _lifecycleListeners: {
    connect: [],
    disconnect: [],
    connect_error: [],
    reconnect_attempt: [],
    reconnect: [],
  },

  /**
   * Initialize Socket.IO connection instance and lifecycle bindings.
   */
  init() {
    if (typeof io !== 'undefined' && !this.socket) {
      this.socket = io();
      this.isConnected = Boolean(this.socket.connected);

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.isReconnecting = false;
        this._notifyLifecycle('connect');
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        this._notifyLifecycle('disconnect', reason);
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        this._notifyLifecycle('connect_error', error);
      });

      if (this.socket.io) {
        this.socket.io.on('reconnect_attempt', (attemptNumber) => {
          this.isReconnecting = true;
          this._notifyLifecycle('reconnect_attempt', attemptNumber);
        });

        this.socket.io.on('reconnect', (attemptNumber) => {
          this.isConnected = true;
          this.isReconnecting = false;
          this._notifyLifecycle('reconnect', attemptNumber);
        });
      }
    }
  },

  /**
   * Internal helper to dispatch lifecycle events to registered subscribers.
   * @param {string} event - Lifecycle event name
   * @param {*} [payload] - Event payload
   */
  _notifyLifecycle(event, payload) {
    const list = this._lifecycleListeners[event];
    if (Array.isArray(list)) {
      list.forEach((handler) => {
        if (typeof handler === 'function') {
          handler(payload);
        }
      });
    }
  },

  /**
   * Subscribe to socket connection event.
   * @param {Function} handler - Connection event callback
   */
  onConnect(handler) {
    if (!this.socket) this.init();
    if (typeof handler === 'function') {
      this._lifecycleListeners.connect.push(handler);
    }
  },

  /**
   * Subscribe to socket disconnect event.
   * @param {Function} handler - Disconnect event callback (reason)
   */
  onDisconnect(handler) {
    if (!this.socket) this.init();
    if (typeof handler === 'function') {
      this._lifecycleListeners.disconnect.push(handler);
    }
  },

  /**
   * Subscribe to socket connection error event.
   * @param {Function} handler - Connect error callback (error)
   */
  onConnectError(handler) {
    if (!this.socket) this.init();
    if (typeof handler === 'function') {
      this._lifecycleListeners.connect_error.push(handler);
    }
  },

  /**
   * Subscribe to socket reconnection attempt event.
   * @param {Function} handler - Reconnect attempt callback (attemptNumber)
   */
  onReconnectAttempt(handler) {
    if (!this.socket) this.init();
    if (typeof handler === 'function') {
      this._lifecycleListeners.reconnect_attempt.push(handler);
    }
  },

  /**
   * Subscribe to socket successful reconnection event.
   * @param {Function} handler - Reconnect callback (attemptNumber)
   */
  onReconnect(handler) {
    if (!this.socket) this.init();
    if (typeof handler === 'function') {
      this._lifecycleListeners.reconnect.push(handler);
    }
  },

  /**
   * Request to register username and join the chat room.
   * @param {string} username - User display name
   * @param {Function} [callback] - Acknowledgment callback
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

    this.currentUser = username;

    this.socket.emit('user:join', { username }, (response) => {
      if (response && response.error) {
        this.currentUser = null;
        this.hasJoined = false;
      } else if (response && response.success) {
        this.hasJoined = true;
        this.currentUser = (response.user && response.user.username) || username;
      }
      if (typeof callback === 'function') {
        callback(response);
      }
    });
  },

  /**
   * Automatically re-join the active chat room with cached credentials after reconnection.
   * @param {Function} [callback] - Re-join acknowledgment callback
   */
  rejoin(callback) {
    if (!this.socket) {
      this.init();
    }

    if (!this.currentUser || !this.hasJoined) {
      if (typeof callback === 'function') {
        callback({ error: 'No active session to rejoin' });
      }
      return;
    }

    this.socket.emit('user:join', { username: this.currentUser }, (response) => {
      if (response && response.error) {
        this.hasJoined = false;
      } else if (response && response.success) {
        this.hasJoined = true;
        this.currentUser = (response.user && response.user.username) || this.currentUser;
      }
      if (typeof callback === 'function') {
        callback(response);
      }
    });
  },

  /**
   * Subscribe to initial users roster snapshot.
   * @param {Function} handler - Users list event handler
   */
  onUsersList(handler) {
    if (!this.socket) this.init();
    if (this.socket && typeof handler === 'function') {
      this.socket.on('users:list', handler);
    }
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
   * Subscribe to message history buffer on connection.
   * @param {Function} handler - History event handler ({ messages: Message[] })
   */
  onMessageHistory(handler) {
    if (!this.socket) this.init();
    if (this.socket && typeof handler === 'function') {
      this.socket.on('message:history', handler);
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

  /**
   * Notify server of current user's typing activity.
   * @param {boolean} isTyping - Whether the user is currently typing
   */
  sendTyping(isTyping) {
    if (!this.socket) {
      return;
    }
    this.socket.emit('user:typing', { isTyping: Boolean(isTyping) });
  },

  /**
   * Subscribe to peer typing status updates.
   * @param {Function} handler - Typing event callback ({ username, isTyping })
   */
  onUserTyping(handler) {
    if (!this.socket) this.init();
    if (this.socket && typeof handler === 'function') {
      this.socket.on('user:typing', handler);
    }
  },
};
