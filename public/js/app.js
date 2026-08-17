/**
 * Main Application Orchestrator
 *
 * Bootstraps the application, coordinates UI interactions, and connects
 * user actions to Socket.IO network events.
 */

window.Chatter = window.Chatter || {};

window.Chatter.app = {
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

    // Handle message sending form submission
    if (ui.elements.messageForm) {
      ui.elements.messageForm.addEventListener('submit', (e) => {
        e.preventDefault();

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

    // Inbound socket event: message received
    socket.onMessageReceive((message) => {
      const isSelf = message.username === socket.currentUser;
      ui.renderMessage(message, isSelf);
      ui.scrollToBottom();
    });

    // Inbound socket event: peer user joined
    socket.onUserJoined((data) => {
      if (data && data.username && data.username !== socket.currentUser) {
        ui.renderSystemMessage(`${data.username} joined the chat`);
        ui.scrollToBottom();
      }
    });

    // Inbound socket event: peer user left
    socket.onUserLeft((data) => {
      if (data && data.username) {
        ui.renderSystemMessage(`${data.username} left the chat`);
        ui.scrollToBottom();
      }
    });
  },
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.Chatter.app.init();
});
