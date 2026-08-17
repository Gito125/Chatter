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
