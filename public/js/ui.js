/**
 * UI Module
 *
 * Handles DOM manipulation, rendering messages, grouping consecutive messages,
 * formatting localized timestamps, and managing smart auto-scroll interactions.
 * Strictly avoids raw innerHTML injection of user data to prevent XSS attacks.
 *
 * Learning Note:
 * Using textContent ensures that strings like "<script>alert(1)</script>"
 * are treated as harmless literal text characters rather than executable markup.
 */

window.Chatter = window.Chatter || {};

window.Chatter.ui = {
  elements: {},

  // Configuration constants
  GROUPING_WINDOW_MS: 120000, // 120 seconds / 2 minutes
  SCROLL_THRESHOLD_PX: 100, // 100 pixels threshold for auto-scroll

  // Tracking state for consecutive message grouping
  lastMessageState: null,

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
      typingIndicator: document.getElementById('typing-indicator'),
      typingText: document.getElementById('typing-text'),
      scrollBottomBtn: document.getElementById('scroll-bottom-btn'),
      scrollBottomText: document.getElementById('scroll-bottom-text'),
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      themeToggleIcon: document.getElementById('theme-toggle-icon'),
      sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
      sidebarToggleIcon: document.getElementById('sidebar-toggle-icon'),
      sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
      sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    };
  },

  /**
   * Check whether the mobile drawer is currently open.
   * @returns {boolean} True if drawer has 'open' class
   */
  isSidebarOpen() {
    return Boolean(this.elements.usersSidebar && this.elements.usersSidebar.classList.contains('open'));
  },

  /**
   * Open the mobile online users drawer.
   */
  openSidebar() {
    const { usersSidebar, sidebarBackdrop, sidebarToggleBtn } = this.elements;
    if (!usersSidebar) return;

    usersSidebar.classList.add('open');
    usersSidebar.setAttribute('aria-hidden', 'false');

    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove('hidden');
      sidebarBackdrop.setAttribute('aria-hidden', 'false');
    }

    if (sidebarToggleBtn) {
      sidebarToggleBtn.setAttribute('aria-expanded', 'true');
      sidebarToggleBtn.setAttribute('aria-label', 'Close online users roster');
    }

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('drawer-open');
    }
  },

  /**
   * Close the mobile online users drawer.
   */
  closeSidebar() {
    const { usersSidebar, sidebarBackdrop, sidebarToggleBtn } = this.elements;
    if (!usersSidebar) return;

    usersSidebar.classList.remove('open');

    // On desktop, aria-hidden should be false; on mobile when closed, true
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    usersSidebar.setAttribute('aria-hidden', isDesktop ? 'false' : 'true');

    if (sidebarBackdrop) {
      sidebarBackdrop.classList.add('hidden');
      sidebarBackdrop.setAttribute('aria-hidden', 'true');
    }

    if (sidebarToggleBtn) {
      sidebarToggleBtn.setAttribute('aria-expanded', 'false');
      sidebarToggleBtn.setAttribute('aria-label', 'Open online users roster');
    }

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('drawer-open');
    }
  },

  /**
   * Toggle the mobile online users drawer state.
   */
  toggleSidebar() {
    if (this.isSidebarOpen()) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
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
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  },

  /**
   * Format ISO timestamp into a localized full date/time string for tooltips.
   * @param {string} isoString - ISO formatted timestamp
   * @returns {string} Localized full date and time string
   */
  formatFullDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleString();
    } catch {
      return '';
    }
  },

  /**
   * Render a chat message bubble into the messages feed with consecutive grouping.
   * All user-supplied strings are set via textContent and safe setAttribute to prevent XSS.
   * @param {Object} message - Message object { id, username, text, timestamp }
   * @param {boolean} isSelf - Whether the current user sent the message
   */
  renderMessage(message, isSelf) {
    if (!this.elements.messagesList || !message) return;

    const rawTime = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
    const msgTime = Number.isNaN(rawTime) ? Date.now() : rawTime;
    const fullDateTooltip = this.formatFullDate(message.timestamp);

    // Evaluate consecutive message grouping (same user, same perspective, within 120s)
    const isGrouped = Boolean(
      this.lastMessageState &&
      this.lastMessageState.username === message.username &&
      this.lastMessageState.isSelf === isSelf &&
      Math.abs(msgTime - this.lastMessageState.timestamp) <= this.GROUPING_WINDOW_MS
    );

    const itemEl = document.createElement('div');
    itemEl.classList.add('message-item');
    itemEl.classList.add(isSelf ? 'self' : 'other');
    if (isGrouped) {
      itemEl.classList.add('grouped');
    }
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
    if (fullDateTooltip) {
      timeEl.setAttribute('title', fullDateTooltip);
    }

    metaEl.appendChild(senderEl);
    metaEl.appendChild(timeEl);

    const bubbleEl = document.createElement('div');
    bubbleEl.classList.add('message-bubble');
    bubbleEl.textContent = message.text;
    if (fullDateTooltip) {
      bubbleEl.setAttribute('title', fullDateTooltip);
    }

    itemEl.appendChild(metaEl);
    itemEl.appendChild(bubbleEl);

    this.elements.messagesList.appendChild(itemEl);

    // Update last message state for grouping tracking
    this.lastMessageState = {
      username: message.username,
      timestamp: msgTime,
      isSelf,
    };
  },

  /**
   * Render active online users roster in the sidebar.
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
   * Render a centered system notice (e.g., "Alice joined the chat").
   * Resets grouping state so subsequent messages start fresh groups.
   * @param {string} text - Notice text
   */
  renderSystemMessage(text) {
    if (!this.elements.messagesList || !text) return;

    // Reset grouping anchor on intervening system notices
    this.lastMessageState = null;

    const systemEl = document.createElement('div');
    systemEl.classList.add('message-system');
    systemEl.textContent = text;

    this.elements.messagesList.appendChild(systemEl);
  },

  /**
   * Determine if the user's scroll position is within threshold distance of bottom.
   * @param {number} [threshold=this.SCROLL_THRESHOLD_PX] - Pixel threshold
   * @returns {boolean} True if within threshold of bottom
   */
  isUserNearBottom(threshold = this.SCROLL_THRESHOLD_PX) {
    const container = this.elements.messagesContainer;
    if (!container) return true;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold;
  },

  /**
   * Scroll the message viewport down to the latest message.
   * @param {boolean} [smooth=false] - Whether to animate smooth scroll
   */
  scrollToBottom(smooth = false) {
    const container = this.elements.messagesContainer;
    if (!container) return;

    if (smooth && typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  },

  /**
   * Show the floating "New messages below ↓" jump button.
   */
  showScrollButton() {
    if (this.elements.scrollBottomBtn) {
      this.elements.scrollBottomBtn.classList.remove('hidden');
    }
  },

  /**
   * Hide the floating "New messages below ↓" jump button.
   */
  hideScrollButton() {
    if (this.elements.scrollBottomBtn) {
      this.elements.scrollBottomBtn.classList.add('hidden');
    }
  },

  /**
   * Render historical messages on initial join.
   * @param {Array<Object>} messages - Array of recent Message objects
   * @param {string} [currentUsername] - Current user display name
   */
  renderMessageHistory(messages, currentUsername) {
    if (!Array.isArray(messages)) return;

    // Reset grouping state before rendering history
    this.lastMessageState = null;

    messages.forEach((msg) => {
      if (msg && msg.text && msg.username) {
        this.renderMessage(msg, msg.username === currentUsername);
      }
    });

    // Unconditionally scroll to bottom and hide jump button for initial history view
    this.scrollToBottom(false);
    this.hideScrollButton();
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

  /**
   * Render real-time typing indicator banner with pluralized labels.
   * Employs strict textContent DOM insertion for complete XSS safety.
   * @param {Array<string>} typingUsers - List of usernames currently typing
   */
  renderTypingIndicator(typingUsers) {
    if (!this.elements.typingIndicator) return;

    if (!Array.isArray(typingUsers) || typingUsers.length === 0) {
      this.elements.typingIndicator.classList.add('hidden');
      if (this.elements.typingText) {
        this.elements.typingText.textContent = '';
      }
      return;
    }

    let text = '';
    if (typingUsers.length === 1) {
      text = `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      text = `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else {
      text = 'Several people are typing...';
    }

    if (this.elements.typingText) {
      this.elements.typingText.textContent = text;
    }

    this.elements.typingIndicator.classList.remove('hidden');
  },
};
