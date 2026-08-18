/**
 * Main Application Orchestrator
 *
 * Bootstraps the application, coordinates UI interactions, and connects
 * user actions to Socket.IO network events.
 */

window.Chatter = window.Chatter || {};

window.Chatter.app = {
  // Typing activity tracker state
  isSelfTyping: false,
  selfTypingTimeoutId: null,
  DEBOUNCE_TYPING_MS: 3000,
  FALLBACK_SAFETY_MS: 4000,
  remoteTypingUsers: new Map(),

  /**
   * Initialize the Chatter client application.
   */
  init() {
    // Initialize UI and Socket subsystems
    window.Chatter.ui.init();
    window.Chatter.socket.init();

    this.bindEvents();

    // Show initial username modal and focus input
    window.Chatter.ui.showModal();
    window.Chatter.ui.focusUsernameInput();
  },

  /**
   * Stop self typing activity and notify the server.
   */
  stopSelfTyping() {
    if (this.selfTypingTimeoutId) {
      clearTimeout(this.selfTypingTimeoutId);
      this.selfTypingTimeoutId = null;
    }
    if (this.isSelfTyping) {
      this.isSelfTyping = false;
      window.Chatter.socket.sendTyping(false);
    }
  },

  /**
   * Update the typing indicator UI with the current list of remote typers.
   */
  updateRemoteTypingUI() {
    const users = Array.from(this.remoteTypingUsers.keys());
    window.Chatter.ui.renderTypingIndicator(users);
  },

  /**
   * Remove a remote user from typing map and cancel their fallback timer.
   * @param {string} username - Username of the departed or stopped typer
   */
  clearRemoteUserTyping(username) {
    if (this.remoteTypingUsers.has(username)) {
      clearTimeout(this.remoteTypingUsers.get(username));
      this.remoteTypingUsers.delete(username);
      this.updateRemoteTypingUI();
    }
  },

  /**
   * Bind DOM event listeners and Socket.IO inbound listeners.
   */
  bindEvents() {
    const { ui, socket } = window.Chatter;

    // Handle username form submission
    if (ui.elements.usernameForm) {
      ui.elements.usernameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        ui.clearError();

        const rawUsername = ui.elements.usernameInput ? ui.elements.usernameInput.value : '';
        const username = rawUsername.trim();

        if (username.length < 1 || username.length > 25) {
          ui.showError('Username must be between 1 and 25 characters');
          ui.focusUsernameInput();
          return;
        }

        socket.join(username, (response) => {
          if (response && response.error) {
            ui.showError(response.error);
            ui.focusUsernameInput();
            return;
          }

          // Successfully joined
          ui.hideModal();
          ui.focusMessageInput();
        });
      });
    }

    // Handle input typing events with 3000ms debouncing
    if (ui.elements.messageInput) {
      ui.elements.messageInput.addEventListener('input', () => {
        const rawText = ui.elements.messageInput ? ui.elements.messageInput.value : '';
        const text = rawText.trim();

        // If input cleared (e.g. backspace/delete), immediately cancel typing
        if (!text) {
          this.stopSelfTyping();
          return;
        }

        // Transition from idle to typing state
        if (!this.isSelfTyping) {
          this.isSelfTyping = true;
          socket.sendTyping(true);
        }

        // Reset the 3000ms inactivity debounce timer
        if (this.selfTypingTimeoutId) {
          clearTimeout(this.selfTypingTimeoutId);
        }
        this.selfTypingTimeoutId = setTimeout(() => {
          this.stopSelfTyping();
        }, this.DEBOUNCE_TYPING_MS);
      });
    }

    // Handle message sending form submission
    if (ui.elements.messageForm) {
      ui.elements.messageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Immediately stop typing indicator upon sending
        this.stopSelfTyping();

        const rawText = ui.elements.messageInput ? ui.elements.messageInput.value : '';
        const text = rawText.trim();

        if (!text) {
          return;
        }

        socket.sendMessage(text, (response) => {
          if (response && response.error) {
            console.error('Failed to send message:', response.error);
          }
        });

        ui.clearMessageInput();
        ui.focusMessageInput();
      });
    }

    // Handle scroll events in messages container to dismiss jump button when near bottom
    if (ui.elements.messagesContainer) {
      ui.elements.messagesContainer.addEventListener('scroll', () => {
        if (ui.isUserNearBottom()) {
          ui.hideScrollButton();
        }
      });
    }

    // Handle floating scroll-to-bottom jump button click
    if (ui.elements.scrollBottomBtn) {
      ui.elements.scrollBottomBtn.addEventListener('click', () => {
        ui.scrollToBottom(true);
        ui.hideScrollButton();
        ui.focusMessageInput();
      });
    }

    // Inbound socket event: message history snapshot on join
    socket.onMessageHistory((data) => {
      if (data && Array.isArray(data.messages)) {
        ui.renderMessageHistory(data.messages, socket.currentUser);
      }
    });

    // Inbound socket event: message received
    socket.onMessageReceive((message) => {
      // Clear remote typing indicator when user sends a message
      if (message && message.username) {
        this.clearRemoteUserTyping(message.username);
      }

      const isSelf = message.username === socket.currentUser;
      const wasNearBottom = ui.isUserNearBottom();

      ui.renderMessage(message, isSelf);

      if (isSelf || wasNearBottom) {
        ui.scrollToBottom(false);
        ui.hideScrollButton();
      } else {
        // User has scrolled up to review history: preserve scroll position and show jump button
        ui.showScrollButton();
      }
    });

    // Inbound socket event: peer typing activity update
    socket.onUserTyping((data) => {
      if (!data || !data.username || data.username === socket.currentUser) {
        return;
      }

      if (data.isTyping) {
        // Clear any existing safety timer for this user
        if (this.remoteTypingUsers.has(data.username)) {
          clearTimeout(this.remoteTypingUsers.get(data.username));
        }

        // Set defensive 4000ms safety timer in case of dropped packets
        const timeoutId = setTimeout(() => {
          this.clearRemoteUserTyping(data.username);
        }, this.FALLBACK_SAFETY_MS);

        this.remoteTypingUsers.set(data.username, timeoutId);
        this.updateRemoteTypingUI();
      } else {
        this.clearRemoteUserTyping(data.username);
      }
    });

    // Inbound socket event: initial users roster snapshot
    socket.onUsersList((data) => {
      if (data && Array.isArray(data.users)) {
        ui.renderUserList(data.users, socket.currentUser);
      }
    });

    // Inbound socket event: peer user joined
    socket.onUserJoined((data) => {
      if (data && Array.isArray(data.users)) {
        ui.renderUserList(data.users, socket.currentUser);
      }
      if (data && data.username && data.username !== socket.currentUser) {
        const wasNearBottom = ui.isUserNearBottom();
        ui.renderSystemMessage(`${data.username} joined the chat`);
        if (wasNearBottom) {
          ui.scrollToBottom();
        }
      }
    });

    // Inbound socket event: peer user left
    socket.onUserLeft((data) => {
      // Purge active typing indicator for departed user
      if (data && data.username) {
        this.clearRemoteUserTyping(data.username);
      }

      if (data && Array.isArray(data.users)) {
        ui.renderUserList(data.users, socket.currentUser);
      }
      if (data && data.username) {
        const wasNearBottom = ui.isUserNearBottom();
        ui.renderSystemMessage(`${data.username} left the chat`);
        if (wasNearBottom) {
          ui.scrollToBottom();
        }
      }
    });
  },
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.Chatter.app.init();
});
