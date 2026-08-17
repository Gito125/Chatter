/**
 * Theme Module
 *
 * Manages active theme state on window.Chatter.theme.
 * Initialized with dark theme for Sprint 1.
 */

window.Chatter = window.Chatter || {};

window.Chatter.theme = {
  current: 'dark',

  /**
   * Initialize theme attribute on the root html element.
   */
  init() {
    document.documentElement.setAttribute('data-theme', this.current);
  },
};

// Immediately initialize theme on load
window.Chatter.theme.init();
