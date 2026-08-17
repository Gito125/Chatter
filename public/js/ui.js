/**
 * UI Module
 *
 * Handles DOM manipulation, rendering messages, and managing modal views.
 * Strictly avoids raw innerHTML injection of user data to prevent XSS attacks.
 *
 * Learning Note:
 * Using textContent ensures that strings like "<script>alert(1)</script>"
 * are treated as harmless literal text characters rather than executable markup.
 */

window.Chatter = window.Chatter || {};

window.Chatter.ui = {
  elements: {},

  /**
   * Cache DOM elements for efficient access.
   */
  init() {
    this.elements = {
      usernameModal: document.getElementById('username-modal'),
      usernameForm: document.getElementById('username-form'),
      usernameInput: document.getElementById('username-input'),
      usernameError: document.getElementById('username-error'),
      joinBtn: document.getElementById('join-btn'),
      messagesContainer: document.getElementById('messages-container'),
      messagesList: document.getElementById('messages-list'),
      messageForm: document.getElementById('message-form'),
      messageInput: document.getElementById('message-input'),
      sendBtn: document.getElementById('send-btn'),
      usersSidebar: document.getElementById('users-sidebar'),
      usersList: document.getElementById('users-list'),
      userCountText: document.getElementById('user-count-text'),
      sidebarUserCount: document.getElementById('sidebar-user-count'),
      userCountBadge: document.getElementById('user-count-badge'),
    };
  },

  /**
   * Show the username entry modal dialog.
   */
  showModal() {
    if (this.elements.usernameModal) {
      this.elements.usernameModal.classList.remove('hidden');
    }
  },

  /**
   * Hide the username entry modal dialog.
   */
  hideModal() {
    if (this.elements.usernameModal) {
      this.elements.usernameModal.classList.add('hidden');
    }
  },

  /**
   * Display a validation error message in the username modal.
   * @param {string} message - Error description
   */
  showError(message) {
    if (this.elements.usernameError) {
      this.elements.usernameError.textContent = message;
    }
  },

  /**
   * Clear any active error message.
   */
  clearError() {
    if (this.elements.usernameError) {
      this.elements.usernameError.textContent = '';
    }
  },

  /**
   * Format ISO timestamp string into a localized time string (e.g., "10:42 AM").
   * @param {string} isoString - ISO formatted timestamp
   * @returns {string} Formatted short time
   */
  formatTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  },

  /**
   * Render a chat message bubble into the messages feed.
   * All user-supplied strings are set via textContent to prevent XSS.
   * @param {Object} message - Message object { id, username, text, timestamp }
   * @param {boolean} isSelf - Whether the current user sent the message
   */
  renderMessage(message, isSelf) {
    if (!this.elements.messagesList || !message) return;

    const itemEl = document.createElement('div');
    itemEl.classList.add('message-item');
    itemEl.classList.add(isSelf ? 'self' : 'other');
    if (message.id) {
      itemEl.dataset.messageId = message.id;
    }

    const metaEl = document.createElement('div');
    metaEl.classList.add('message-meta');

    const senderEl = document.createElement('span');
    senderEl.classList.add('message-sender');
    senderEl.textContent = isSelf ? 'You' : message.username;

    const timeEl = document.createElement('span');
    timeEl.classList.add('message-time');
    timeEl.textContent = this.formatTime(message.timestamp);

    metaEl.appendChild(senderEl);
    metaEl.appendChild(timeEl);

    const bubbleEl = document.createElement('div');
    bubbleEl.classList.add('message-bubble');
    bubbleEl.textContent = message.text;

    itemEl.appendChild(metaEl);
    itemEl.appendChild(bubbleEl);

    this.elements.messagesList.appendChild(itemEl);
  },

  /**
   * Update online user count across header and sidebar badges.
   * @param {number} count - Active user count
   */
  updateUserCount(count) {
    const safeCount = typeof count === 'number' && count >= 0 ? count : 0;
    const label = `${safeCount} online`;
    if (this.elements.userCountText) {
      this.elements.userCountText.textContent = label;
    }
    if (this.elements.sidebarUserCount) {
      this.elements.sidebarUserCount.textContent = String(safeCount);
    }
  },

  /**
   * Render the active online users roster in the sidebar.
   * Employs strict textContent DOM insertion for complete XSS safety.
   * @param {Array<Object>} users - List of active User objects
   * @param {string} [currentUsername] - Current client username
   */
  renderUserList(users, currentUsername) {
    if (!this.elements.usersList) return;

    // Clear existing roster items safely
    this.elements.usersList.textContent = '';

    if (!Array.isArray(users)) {
      this.updateUserCount(0);
      return;
    }

    this.updateUserCount(users.length);

    // Sort: current user first, then alphabetically by username
    const sortedUsers = [...users].sort((a, b) => {
      if (a.username === currentUsername) return -1;
      if (b.username === currentUsername) return 1;
      return (a.username || '').localeCompare(b.username || '', undefined, { sensitivity: 'base' });
    });

    sortedUsers.forEach((user) => {
      if (!user || !user.username) return;

      const itemEl = document.createElement('li');
      itemEl.classList.add('user-item');
      if (user.id) {
        itemEl.dataset.userId = user.id;
      }

      // User avatar circle with first character
      const avatarEl = document.createElement('div');
      avatarEl.classList.add('user-avatar');
      const trimmed = user.username.trim();
      const firstChar = Array.from(trimmed)[0] || '?';
      avatarEl.textContent = firstChar.toUpperCase();

      // User info container
      const infoEl = document.createElement('div');
      infoEl.classList.add('user-info');

      const nameEl = document.createElement('span');
      nameEl.classList.add('user-name');
      nameEl.textContent = user.username;
      infoEl.appendChild(nameEl);

      if (user.username === currentUsername) {
        const selfTagEl = document.createElement('span');
        selfTagEl.classList.add('user-tag-self');
        selfTagEl.textContent = 'You';
        infoEl.appendChild(selfTagEl);
      }

      // Online status indicator dot
      const statusDotEl = document.createElement('span');
      statusDotEl.classList.add('status-dot', 'online');
      statusDotEl.setAttribute('aria-label', 'Online');

      itemEl.appendChild(avatarEl);
      itemEl.appendChild(infoEl);
      itemEl.appendChild(statusDotEl);

      this.elements.usersList.appendChild(itemEl);
    });
  },

  /**
   * Render a centered system notice (e.g., "Alice joined the chat").
   * @param {string} text - Notice text
   */
  renderSystemMessage(text) {
    if (!this.elements.messagesList || !text) return;

    const systemEl = document.createElement('div');
    systemEl.classList.add('message-system');
    systemEl.textContent = text;

    this.elements.messagesList.appendChild(systemEl);
  },

  /**
   * Scroll the message viewport down to the latest message.
   */
  scrollToBottom() {
    if (this.elements.messagesContainer) {
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }
  },

  /**
   * Clear the chat input field.
   */
  clearMessageInput() {
    if (this.elements.messageInput) {
      this.elements.messageInput.value = '';
    }
  },

  /**
   * Focus the chat input field.
   */
  focusMessageInput() {
    if (this.elements.messageInput) {
      this.elements.messageInput.focus();
    }
  },

  /**
   * Focus the username modal input field.
   */
  focusUsernameInput() {
    if (this.elements.usernameInput) {
      this.elements.usernameInput.focus();
    }
  },
};
