/**
 * Theme Module
 *
 * Manages active theme state, localStorage persistence, OS media query detection,
 * and live system theme change synchronization.
 *
 * Learning Note:
 * Using CSS Custom Properties combined with document.documentElement.setAttribute('data-theme', theme)
 * allows instant, atomic re-theming of the entire DOM without costly stylesheet recompilation
 * or manual element-by-element style modifications.
 */

window.Chatter = window.Chatter || {};

window.Chatter.theme = {
  STORAGE_KEY: 'chatter-theme',
  THEMES: {
    DARK: 'dark',
    LIGHT: 'light',
  },
  current: 'dark',
  mediaQuery: null,

  /**
   * Safe localStorage getter with try/catch to protect against private browsing restrictions.
   * Strictly validates returned value against allowed theme enum.
   * @returns {string|null} Stored theme ('dark'|'light') or null
   */
  getStoredTheme() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === this.THEMES.DARK || stored === this.THEMES.LIGHT) {
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Safe localStorage setter with try/catch.
   * @param {string} theme - 'dark' or 'light'
   */
  saveStoredTheme(theme) {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch {
      // Gracefully handle storage errors in private browsing or quota limits
    }
  },

  /**
   * Detect preferred system theme from window.matchMedia.
   * @returns {string} 'dark' or 'light'
   */
  getSystemTheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return this.mediaQuery.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
    }
    return this.THEMES.DARK;
  },

  /**
   * Resolve initial theme on startup.
   * Priority order: 1. localStorage explicit override, 2. OS preference, 3. Default 'dark'
   * @returns {string} Resolved theme name
   */
  resolveInitialTheme() {
    return this.getStoredTheme() || this.getSystemTheme() || this.THEMES.DARK;
  },

  /**
   * Apply theme to root document element and update UI toggle icon/labels.
   * @param {string} theme - 'dark' or 'light'
   * @param {boolean} [save=true] - Whether to persist to localStorage
   */
  applyTheme(theme, save = true) {
    const validTheme = theme === this.THEMES.LIGHT ? this.THEMES.LIGHT : this.THEMES.DARK;
    this.current = validTheme;

    // Apply data-theme attribute on <html> element
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', validTheme);
    }

    // Update toggle button icon and aria-label if present in DOM
    const toggleIcon = document.getElementById('theme-toggle-icon');
    const toggleBtn = document.getElementById('theme-toggle-btn');

    if (toggleIcon) {
      toggleIcon.textContent = validTheme === this.THEMES.DARK ? '🌙' : '☀️';
    }

    if (toggleBtn) {
      const nextTheme = validTheme === this.THEMES.DARK ? 'light' : 'dark';
      toggleBtn.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
      toggleBtn.setAttribute('title', `Switch to ${nextTheme} theme`);
    }

    if (save) {
      this.saveStoredTheme(validTheme);
    }
  },

  /**
   * Toggle between dark and light themes.
   * @returns {string} The newly applied theme
   */
  toggleTheme() {
    const nextTheme = this.current === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
    this.applyTheme(nextTheme, true);
    return nextTheme;
  },

  /**
   * Bind OS media query change listener and theme toggle button clicks.
   */
  bindEvents() {
    // Listen for OS system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = (e) => {
        // Only adapt to OS changes if user hasn't explicitly set a preference in localStorage
        if (!this.getStoredTheme()) {
          this.applyTheme(e.matches ? this.THEMES.DARK : this.THEMES.LIGHT, false);
        }
      };

      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleMediaChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(handleMediaChange);
      }
    }

    // Bind theme toggle button click listener
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  },

  /**
   * Initialize theme module on page load.
   */
  init() {
    const initialTheme = this.resolveInitialTheme();
    this.applyTheme(initialTheme, false);
  },
};

// Immediately evaluate theme to prevent flash of wrong theme (FOUC)
window.Chatter.theme.init();

// Bind DOM and media query listeners when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.Chatter.theme.bindEvents();
      window.Chatter.theme.applyTheme(window.Chatter.theme.current, false);
    });
  } else {
    window.Chatter.theme.bindEvents();
  }
}
