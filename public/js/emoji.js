/**
 * Emoji Module
 *
 * Provides a lightweight, accessible inline emoji quick-picker.
 * Supports caret-position-preserving insertion, click-outside auto-dismissal,
 * keyboard accessibility, and zero-dependency DOM rendering.
 *
 * Learning Note:
 * HTMLInputElement.setSelectionRange() allows placing the text cursor at an exact character offset,
 * ensuring that inserting an emoji in the middle of existing draft text preserves the user's focus.
 */

window.Chatter = window.Chatter || {};

(function () {
  const EMOJIS = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
    '😍', '🥰', '😘', '😎', '🤩', '🥳', '🤔', '🤫',
    '😴', '😭', '😱', '🔥', '✨', '🎉', '💯', '❤️',
    '👍', '👎', '👏', '🙌', '🚀', '💡', '💬', '👀',
    '🍕', '☕', '🎮', '💻', '🌟', '⚡', '🎯', '👋'
  ];

  window.Chatter.emoji = {
    initialized: false,
    elements: {},

    /**
     * Get the curated array of available emojis.
     * @returns {Array<string>} Array of emoji character strings
     */
    getEmojis() {
      return [...EMOJIS];
    },

    /**
     * Initialize the emoji subsystem, cache DOM elements, render grid, and bind event listeners.
     */
    init() {
      this.elements = {
        emojiPicker: document.getElementById('emoji-picker'),
        emojiGrid: document.getElementById('emoji-grid'),
        emojiToggleBtn: document.getElementById('emoji-toggle-btn'),
        messageInput: document.getElementById('message-input'),
      };

      this.renderPicker();
      this.bindEvents();
      this.initialized = true;
    },

    /**
     * Render the emoji grid buttons safely into #emoji-grid using standard DOM APIs.
     */
    renderPicker() {
      if (!this.elements.emojiGrid) return;

      this.elements.emojiGrid.textContent = '';

      EMOJIS.forEach((emoji) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-btn';
        btn.dataset.emoji = emoji;
        btn.setAttribute('aria-label', `${emoji} emoji`);
        btn.textContent = emoji;
        this.elements.emojiGrid.appendChild(btn);
      });
    },

    /**
     * Insert emoji into input element at the active caret position.
     * Preserves cursor location and dispatches synthetic input event to sync live counters.
     * @param {HTMLInputElement} inputElement - Target input element
     * @param {string} emoji - Emoji string to insert
     */
    insertEmoji(inputElement, emoji) {
      const targetInput = inputElement || this.elements.messageInput;
      if (!targetInput || typeof emoji !== 'string') return;

      const currentVal = targetInput.value || '';
      const maxLength = targetInput.maxLength > 0 ? targetInput.maxLength : 500;

      // Determine caret positions
      let start = targetInput.selectionStart;
      let end = targetInput.selectionEnd;

      if (typeof start !== 'number' || typeof end !== 'number') {
        start = currentVal.length;
        end = currentVal.length;
      }

      const before = currentVal.substring(0, start);
      const after = currentVal.substring(end);

      // Check available character space within maxlength boundary
      const availableSpace = maxLength - (before.length + after.length);
      if (availableSpace <= 0) {
        targetInput.focus();
        return;
      }

      const insertedText = emoji.length <= availableSpace ? emoji : emoji.substring(0, availableSpace);
      targetInput.value = before + insertedText + after;

      const newCaretPos = start + insertedText.length;
      if (typeof targetInput.setSelectionRange === 'function') {
        targetInput.setSelectionRange(newCaretPos, newCaretPos);
      }

      targetInput.focus();

      // Dispatch bubbling synthetic 'input' event to trigger live character counter & debouncers
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    },

    /**
     * Check whether the emoji picker popover is currently visible.
     * @returns {boolean} True if picker is open
     */
    isOpen() {
      return Boolean(this.elements.emojiPicker && !this.elements.emojiPicker.classList.contains('hidden'));
    },

    /**
     * Open the emoji picker dialog.
     */
    openPicker() {
      if (!this.elements.emojiPicker) return;

      this.elements.emojiPicker.classList.remove('hidden');
      this.elements.emojiPicker.setAttribute('aria-hidden', 'false');

      if (this.elements.emojiToggleBtn) {
        this.elements.emojiToggleBtn.setAttribute('aria-expanded', 'true');
      }
    },

    /**
     * Close the emoji picker dialog.
     */
    closePicker() {
      if (!this.elements.emojiPicker) return;

      this.elements.emojiPicker.classList.add('hidden');
      this.elements.emojiPicker.setAttribute('aria-hidden', 'true');

      if (this.elements.emojiToggleBtn) {
        this.elements.emojiToggleBtn.setAttribute('aria-expanded', 'false');
      }
    },

    /**
     * Toggle the emoji picker open/closed state.
     */
    togglePicker() {
      if (this.isOpen()) {
        this.closePicker();
      } else {
        this.openPicker();
      }
    },

    /**
     * Bind click, delegation, click-outside, and keyboard listeners.
     */
    bindEvents() {
      // Toggle button click listener
      if (this.elements.emojiToggleBtn) {
        this.elements.emojiToggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.togglePicker();
        });
      }

      // Emoji button selection via grid event delegation
      if (this.elements.emojiGrid) {
        this.elements.emojiGrid.addEventListener('click', (e) => {
          const btn = e.target && e.target.closest ? e.target.closest('.emoji-btn') : null;
          if (btn && btn.dataset && btn.dataset.emoji) {
            this.insertEmoji(this.elements.messageInput, btn.dataset.emoji);
          }
        });
      }

      // Dismiss picker on outside click
      document.addEventListener('click', (e) => {
        if (!this.isOpen()) return;

        const target = e.target;
        const isInsidePicker = this.elements.emojiPicker && this.elements.emojiPicker.contains(target);
        const isInsideToggle = this.elements.emojiToggleBtn && this.elements.emojiToggleBtn.contains(target);

        if (!isInsidePicker && !isInsideToggle) {
          this.closePicker();
        }
      });

      // Dismiss picker on Escape key press and restore focus to toggle button
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.closePicker();
          if (this.elements.emojiToggleBtn) {
            this.elements.emojiToggleBtn.focus();
          }
        }
      });
    },
  };
})();
