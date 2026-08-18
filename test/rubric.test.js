const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

test('Rubric Gate 1 - Dependencies in package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  assert.ok(pkg.dependencies.express, 'express dependency present');
  assert.ok(pkg.dependencies['socket.io'], 'socket.io dependency present');
});

test('Rubric Gate 2 - Express Static Hosting configured in src/server.js', () => {
  const serverCode = fs.readFileSync(path.join(ROOT_DIR, 'src/server.js'), 'utf8');
  assert.match(serverCode, /express\.static\(.*public/);
});

test('Rubric Gate 3 - Socket Event Constants defined in src/socket/events.js', () => {
  const { EVENTS } = require('../src/socket/events');
  assert.equal(EVENTS.USER_JOIN, 'user:join');
  assert.equal(EVENTS.MESSAGE_SEND, 'message:send');
  assert.equal(EVENTS.MESSAGE_RECEIVE, 'message:receive');
  assert.equal(EVENTS.USER_JOINED, 'user:joined');
  assert.equal(EVENTS.USER_LEFT, 'user:left');
  assert.equal(EVENTS.USERS_LIST, 'users:list');
});

test('Rubric Gate 3b - src/socket/handlers.js uses EVENTS constants', () => {
  const handlersCode = fs.readFileSync(path.join(ROOT_DIR, 'src/socket/handlers.js'), 'utf8');
  assert.match(handlersCode, /EVENTS\.USER_JOIN/);
  assert.match(handlersCode, /EVENTS\.MESSAGE_SEND/);
  assert.match(handlersCode, /EVENTS\.MESSAGE_RECEIVE/);
  assert.match(handlersCode, /EVENTS\.USER_JOINED/);
  assert.match(handlersCode, /EVENTS\.USER_LEFT/);
  assert.match(handlersCode, /EVENTS\.USERS_LIST/);
});

test('Rubric Gate 4 - Handlers access data strictly via store module', () => {
  const handlersCode = fs.readFileSync(path.join(ROOT_DIR, 'src/socket/handlers.js'), 'utf8');
  assert.match(handlersCode, /store\.(addUser|getUser|saveMessage|removeUser|getAllUsers)/);
});

test('Rubric Gate 4b - Store module exports presence methods', () => {
  const storeModule = require('../src/store/memory');
  assert.equal(typeof storeModule.addUser, 'function');
  assert.equal(typeof storeModule.getUser, 'function');
  assert.equal(typeof storeModule.removeUser, 'function');
  assert.equal(typeof storeModule.getAllUsers, 'function');
});

test('Rubric Gate 5 - UI Module uses textContent / safe DOM (XSS Prevention)', () => {
  const uiCode = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');
  assert.match(uiCode, /textContent|document\.createTextNode/);
  assert.doesNotMatch(uiCode, /innerHTML\s*=\s*.*(text|username|message)/);
});

test('Rubric Gate 6 - CSS Token Compliance & Zero Hardcoded Colors', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');

  // Check required theme tokens
  assert.match(css, /--bg-primary:/);
  assert.match(css, /--accent:/);
  assert.match(css, /--text-primary:/);
  assert.match(css, /--border-color:/);

  // Extract lines outside [data-theme="..."] blocks and :root
  const lines = css.split('\n');
  let insideThemeBlock = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(':root') || trimmed.startsWith('[data-theme=')) {
      insideThemeBlock = true;
    }
    if (insideThemeBlock && trimmed.endsWith('}')) {
      insideThemeBlock = false;
      return;
    }

    if (!insideThemeBlock) {
      const match = trimmed.match(/#[0-9a-fA-F]{3,6}|rgba?\(|hsla?\(/);
      assert.ok(!match, `Hardcoded color found at line ${index + 1}: ${trimmed}`);
    }
  });
});

test('Rubric Gate 7 - Frontend Modular Namespace & Script Order', () => {
  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/app.js'), 'utf8');
  const socketJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/socket.js'), 'utf8');
  const uiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');

  assert.match(appJs, /window\.Chatter\s*=/);
  assert.match(socketJs, /window\.Chatter\s*=/);
  assert.match(uiJs, /window\.Chatter\s*=/);

  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  const scriptTags = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);

  assert.deepEqual(scriptTags, [
    '/socket.io/socket.io.js',
    'js/theme.js',
    'js/emoji.js',
    'js/ui.js',
    'js/socket.js',
    'js/app.js',
  ]);
});

test('Rubric Gate 8 - Frontend UI Presence & System Message Methods', () => {
  const uiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');
  assert.match(uiJs, /renderUserList\s*\(/);
  assert.match(uiJs, /updateUserCount\s*\(/);
  assert.match(uiJs, /renderSystemMessage\s*\(/);
});

test('Rubric Gate 9 - Frontend Socket Presence Listeners', () => {
  const socketJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/socket.js'), 'utf8');
  assert.match(socketJs, /onUsersList\s*\(/);
  assert.match(socketJs, /onUserJoined\s*\(/);
  assert.match(socketJs, /onUserLeft\s*\(/);
});

test('Rubric Gate 10 - HTML Sidebar Roster & Status Dot Structure', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /id="users-sidebar"/);
  assert.match(html, /id="users-list"/);
  assert.match(html, /id="user-count-badge"/);
  assert.match(html, /id="user-count-text"/);
  assert.match(html, /status-dot/);
});

test('Sprint 3 Gate 1 - Typing Event Constants Architecture', () => {
  const { EVENTS } = require('../src/socket/events');
  assert.equal(EVENTS.USER_TYPING, 'user:typing');
  assert.equal(EVENTS.USER_TYPING_UPDATE, 'user:typing');
});

test('Sprint 3 Gate 2 - Server Handlers Broadcast Isolation', () => {
  const handlersCode = fs.readFileSync(path.join(ROOT_DIR, 'src/socket/handlers.js'), 'utf8');
  assert.match(handlersCode, /EVENTS\.USER_TYPING/);
  assert.match(handlersCode, /socket\.broadcast\.emit\s*\(\s*EVENTS\.USER_TYPING_UPDATE/);
  assert.match(handlersCode, /store\.getUser\s*\(\s*socket\.id\s*\)/);
});

test('Sprint 3 Gate 3 - Semantic HTML Typing Banner', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /id="typing-indicator"/);
  assert.match(html, /id="typing-text"/);
  assert.match(html, /class="[^"]*typing-dots[^"]*"/);
});

test('Sprint 3 Gate 4 - CSS Keyframes and Zero Hardcoded Colors for Typing Banner', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  assert.match(css, /\.typing-indicator/);
  assert.match(css, /\.typing-dots/);
  assert.match(css, /\.typing-dot/);
  assert.match(css, /@keyframes\s+typing-bounce/);
});

test('Sprint 3 Gate 5 - Frontend Socket Typing Methods', () => {
  const socketJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/socket.js'), 'utf8');
  assert.match(socketJs, /sendTyping\s*\(/);
  assert.match(socketJs, /onUserTyping\s*\(/);
});

test('Sprint 3 Gate 6 - Frontend UI Typing Indicator Renderer & XSS Safety', () => {
  const uiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');
  assert.match(uiJs, /renderTypingIndicator\s*\(/);
  assert.match(uiJs, /is typing\.\.\./);
  assert.match(uiJs, /are typing\.\.\./);
  assert.match(uiJs, /Several people are typing\.\.\./);
});

test('Sprint 3 Gate 7 - Frontend App Debounce Engine and Safety Timers', () => {
  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/app.js'), 'utf8');
  assert.match(appJs, /DEBOUNCE_TYPING_MS\s*:\s*3000/);
  assert.match(appJs, /FALLBACK_SAFETY_MS\s*:\s*4000/);
  assert.match(appJs, /stopSelfTyping\s*\(/);
  assert.match(appJs, /clearRemoteUserTyping\s*\(/);
});

test('Sprint 4 Gate 1 - Message History Event Constant Architecture', () => {
  const { EVENTS } = require('../src/socket/events');
  assert.equal(EVENTS.MESSAGE_HISTORY, 'message:history');
});

test('Sprint 4 Gate 2 - Store History Access Method (getRecentMessages)', () => {
  const storeModule = require('../src/store/memory');
  assert.equal(typeof storeModule.getRecentMessages, 'function');
});

test('Sprint 4 Gate 3 - Server History Dispatch on User Join', () => {
  const handlersCode = fs.readFileSync(path.join(ROOT_DIR, 'src/socket/handlers.js'), 'utf8');
  assert.match(handlersCode, /socket\.emit\s*\(\s*EVENTS\.MESSAGE_HISTORY,\s*\{\s*messages:\s*store\.getRecentMessages\(/);
});

test('Sprint 4 Gate 4 - Semantic HTML Floating Jump Button', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /id="scroll-bottom-btn"/);
  assert.match(html, /id="scroll-bottom-text"/);
  assert.match(html, /class="[^"]*scroll-bottom-btn[^"]*"/);
});

test('Sprint 4 Gate 5 - CSS Tokens and Grouping Styles (Zero Hardcoded Colors)', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  assert.match(css, /\.message-item\.grouped/);
  assert.match(css, /\.scroll-bottom-btn/);
  assert.match(css, /\.scroll-bottom-btn\.hidden/);
});

test('Sprint 4 Gate 6 - Frontend UI Grouping and Timestamp Tooltip Logic', () => {
  const uiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');
  assert.match(uiJs, /GROUPING_WINDOW_MS\s*:\s*120000/);
  assert.match(uiJs, /formatFullDate\s*\(/);
  assert.match(uiJs, /renderMessageHistory\s*\(/);
});

test('Sprint 4 Gate 7 - Frontend UI Smart Scroll and Jump Button Helpers', () => {
  const uiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');
  assert.match(uiJs, /isUserNearBottom\s*\(/);
  assert.match(uiJs, /scrollToBottom\s*\(/);
  assert.match(uiJs, /showScrollButton\s*\(/);
  assert.match(uiJs, /hideScrollButton\s*\(/);
});

test('Sprint 4 Gate 8 - Frontend Socket and App Orchestration for History and Smart Scroll', () => {
  const socketJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/socket.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/app.js'), 'utf8');

  assert.match(socketJs, /onMessageHistory\s*\(/);
  assert.match(appJs, /socket\.onMessageHistory\s*\(/);
  assert.match(appJs, /scrollBottomBtn/);
});

test('Sprint 5 Gate 1 - Dual-Theme Token Completeness in styles.css', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /\[data-theme="light"\]/);

  const requiredTokens = [
    '--bg-primary',
    '--bg-secondary',
    '--bg-tertiary',
    '--text-primary',
    '--text-secondary',
    '--text-muted',
    '--accent',
    '--accent-hover',
    '--accent-contrast',
    '--border-color',
    '--status-online',
    '--bubble-self',
    '--bubble-other',
    '--error-color',
    '--overlay-bg',
    '--shadow-color',
    '--input-bg',
    '--badge-bg',
  ];

  requiredTokens.forEach((token) => {
    assert.match(css, new RegExp(`${token}:`), `Token ${token} must be defined`);
  });
});

test('Sprint 5 Gate 2 - HSL Teal Accent Validation', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  assert.match(css, /--accent:\s*hsl\(174,\s*80%,\s*50%\)/, 'Dark theme must use hsl(174, 80%, 50%)');
  assert.match(css, /--accent:\s*hsl\(174,\s*80%,\s*35%\)/, 'Light theme must use hsl(174, 80%, 35%)');
  assert.match(css, /--accent-contrast:\s*hsl\(222,\s*47%,\s*11%\)/, 'Dark contrast must match dark bg');
  assert.match(css, /--accent-contrast:\s*hsl\(0,\s*0%,\s*100%\)/, 'Light contrast must be white');
});

test('Sprint 5 Gate 3 - Strict Zero Hardcoded Colors in Component Rules', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  const lines = css.split('\n');
  let insideThemeBlock = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(':root') || trimmed.startsWith('[data-theme=')) {
      insideThemeBlock = true;
    }
    if (insideThemeBlock && trimmed.endsWith('}')) {
      insideThemeBlock = false;
      return;
    }

    if (!insideThemeBlock) {
      const match = trimmed.match(/#[0-9a-fA-F]{3,6}|rgba?\(|hsla?\(/);
      assert.ok(!match, `Hardcoded color literal found at line ${index + 1}: ${trimmed}`);
    }
  });
});

test('Sprint 5 Gate 4 - Semantic HTML Header Toggle Button', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /id="theme-toggle-btn"/);
  assert.match(html, /id="theme-toggle-icon"/);
  assert.match(html, /class="[^"]*theme-toggle-btn[^"]*"/);
  assert.match(html, /aria-label="[^"]*theme[^"]*"/i);
  assert.match(html, /type="button"/);
});

test('Sprint 5 Gate 5 - Theme Manager Module API on window.Chatter.theme', () => {
  const themeJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/theme.js'), 'utf8');
  assert.match(themeJs, /window\.Chatter\.theme\s*=/);
  assert.match(themeJs, /getStoredTheme\s*\(/);
  assert.match(themeJs, /saveStoredTheme\s*\(/);
  assert.match(themeJs, /getSystemTheme\s*\(/);
  assert.match(themeJs, /resolveInitialTheme\s*\(/);
  assert.match(themeJs, /applyTheme\s*\(/);
  assert.match(themeJs, /toggleTheme\s*\(/);
  assert.match(themeJs, /bindEvents\s*\(/);
  assert.match(themeJs, /init\s*\(/);
});

test('Sprint 5 Gate 6 - Defensive Storage & Error Handling', () => {
  const themeJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/theme.js'), 'utf8');
  assert.match(themeJs, /try\s*\{[\s\S]*localStorage\.getItem/);
  assert.match(themeJs, /try\s*\{[\s\S]*localStorage\.setItem/);
  assert.match(themeJs, /DARK:\s*'dark'/);
  assert.match(themeJs, /LIGHT:\s*'light'/);
});

test('Sprint 5 Gate 7 - System Scheme Sync & FOUC Prevention', () => {
  const themeJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/theme.js'), 'utf8');
  assert.match(themeJs, /matchMedia\s*\(\s*['"]\(prefers-color-scheme:\s*dark\)['"]\s*\)/);
  assert.match(themeJs, /window\.Chatter\.theme\.init\(\)/);
});

test('Sprint 6 Gate 1 - Semantic HTML Mobile Drawer and Toggle Button Structure', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /id="sidebar-toggle-btn"/, 'Must contain #sidebar-toggle-btn');
  assert.match(html, /aria-controls="users-sidebar"/, 'Toggle button must have aria-controls="users-sidebar"');
  assert.match(html, /aria-expanded="false"/, 'Toggle button must start with aria-expanded="false"');
  assert.match(html, /id="sidebar-backdrop"/, 'Must contain #sidebar-backdrop overlay');
  assert.match(html, /id="users-sidebar"/, 'Must contain #users-sidebar');
  assert.match(html, /id="sidebar-close-btn"/, 'Must contain #sidebar-close-btn');
});

test('Sprint 6 Gate 2 - Mobile-First CSS Drawer and 100dvh Tokens', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  assert.match(css, /100dvh/, 'Must configure 100dvh dynamic viewport unit');
  assert.match(css, /body\.drawer-open/, 'Must have body.drawer-open class');
  assert.match(css, /transform:\s*translateX\(-100%\)/, 'Drawer must slide offscreen by default');
  assert.match(css, /transform:\s*translateX\(0\)/, 'Drawer must slide in when open');
  assert.match(css, /\.sidebar-backdrop/, 'Must define .sidebar-backdrop styles');
  assert.match(css, /\.sidebar-backdrop\.hidden/, 'Must define .sidebar-backdrop.hidden styles');
  assert.match(css, /@media\s*\(min-width:\s*768px\)/, 'Must define desktop breakpoint');
  assert.match(css, /\.sidebar-toggle-btn[^{]*\{[^}]*display:\s*none/s, 'Desktop breakpoint must hide sidebar toggle button');
});

test('Sprint 6 Gate 3 - Zero Hardcoded Colors in Mobile CSS', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  const lines = css.split('\n');
  let insideThemeBlock = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(':root') || trimmed.startsWith('[data-theme=')) {
      insideThemeBlock = true;
    }
    if (insideThemeBlock && trimmed.endsWith('}')) {
      insideThemeBlock = false;
      return;
    }

    if (!insideThemeBlock) {
      const match = trimmed.match(/#[0-9a-fA-F]{3,6}|rgba?\(|hsla?\(/);
      assert.ok(!match, `Hardcoded color literal found at line ${index + 1}: ${trimmed}`);
    }
  });
});

test('Sprint 6 Gate 4 - UI Module Drawer Management API', () => {
  const uiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');
  assert.match(uiJs, /openSidebar\s*\(/, 'Must export openSidebar method');
  assert.match(uiJs, /closeSidebar\s*\(/, 'Must export closeSidebar method');
  assert.match(uiJs, /toggleSidebar\s*\(/, 'Must export toggleSidebar method');
  assert.match(uiJs, /isSidebarOpen\s*\(/, 'Must export isSidebarOpen method');
  assert.match(uiJs, /sidebarToggleBtn/, 'Must cache sidebarToggleBtn in elements');
  assert.match(uiJs, /sidebarBackdrop/, 'Must cache sidebarBackdrop in elements');
});

test('Sprint 6 Gate 5 - App Module Mobile Event Wiring', () => {
  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/app.js'), 'utf8');
  assert.match(appJs, /sidebarToggleBtn.*addEventListener/, 'Must bind click listener to sidebarToggleBtn');
  assert.match(appJs, /sidebarBackdrop.*addEventListener/, 'Must bind click listener to sidebarBackdrop');
  assert.match(appJs, /keydown.*Escape|e\.key === 'Escape'/, 'Must bind Escape key listener to close drawer');
  assert.match(appJs, /resize.*innerWidth|window\.innerWidth >= 768/, 'Must bind window resize listener to auto-close drawer on desktop');
});

test('Sprint 7 Gate 1 - Store Duplicate Check Methods & Architecture', () => {
  const store = require('../src/store/memory');
  assert.equal(typeof store.isUsernameTaken, 'function', 'isUsernameTaken must be exported');
  assert.equal(typeof store.getUserByUsername, 'function', 'getUserByUsername must be exported');
  store.clearStore();
  store.addUser({ id: 's1', username: 'Alice' });
  assert.equal(store.isUsernameTaken('alice'), true, 'Must detect duplicate case-insensitively');
  assert.equal(store.isUsernameTaken('Bob'), false, 'Must return false for available username');
  assert.equal(store.isUsernameTaken('Alice', 's1'), false, 'Must exclude given socket ID');
});

test('Sprint 7 Gate 2 - Server Socket Handlers Duplicate Validation', () => {
  const handlersCode = fs.readFileSync(path.join(ROOT_DIR, 'src/socket/handlers.js'), 'utf8');
  assert.match(handlersCode, /store\.isUsernameTaken/, 'src/socket/handlers.js must validate username uniqueness with store.isUsernameTaken');
});

test('Sprint 7 Gate 3 - HTML Connection Status Banner & ARIA Attributes', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /id="connection-status"/, 'Must contain #connection-status');
  assert.match(html, /id="connection-status-dot"/, 'Must contain #connection-status-dot');
  assert.match(html, /id="connection-status-text"/, 'Must contain #connection-status-text');
  assert.match(html, /role="status"/, 'Must contain role="status"');
  assert.match(html, /aria-live="polite"/, 'Must contain aria-live="polite"');
});

test('Sprint 7 Gate 4 - CSS Status Tokens & Zero Hardcoded Colors', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  assert.match(css, /--status-warning:/, 'Missing --status-warning token');
  assert.match(css, /--status-offline:/, 'Missing --status-offline token');
  assert.match(css, /\.connection-status/, 'Missing .connection-status styles');
  assert.match(css, /\.chat-input:disabled|#message-input:disabled/, 'Missing disabled input styles');
});

test('Sprint 7 Gate 5 - Client Socket Module Lifecycle Methods', () => {
  const socketJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/socket.js'), 'utf8');
  assert.match(socketJs, /onConnect\s*\(/, 'Must export onConnect');
  assert.match(socketJs, /onDisconnect\s*\(/, 'Must export onDisconnect');
  assert.match(socketJs, /onConnectError\s*\(/, 'Must export onConnectError');
  assert.match(socketJs, /onReconnectAttempt\s*\(/, 'Must export onReconnectAttempt');
  assert.match(socketJs, /onReconnect\s*\(/, 'Must export onReconnect');
  assert.match(socketJs, /rejoin\s*\(/, 'Must export rejoin');
});

test('Sprint 7 Gate 6 - UI Module Telemetry & Input Lock Helpers', () => {
  const uiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');
  assert.match(uiJs, /renderConnectionStatus\s*\(/, 'Must export renderConnectionStatus');
  assert.match(uiJs, /setChatInputDisabled\s*\(/, 'Must export setChatInputDisabled');
  assert.match(uiJs, /connectionStatus/, 'Must cache connectionStatus elements');
});

test('Sprint 7 Gate 7 - App Module Resilience Coordination', () => {
  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/app.js'), 'utf8');
  assert.match(appJs, /setChatInputDisabled/, 'Must invoke setChatInputDisabled');
  assert.match(appJs, /renderConnectionStatus/, 'Must invoke renderConnectionStatus');
  assert.match(appJs, /rejoin/, 'Must invoke socket.rejoin on reconnection');
});

test('Sprint 8 Gate 1 - Lucide Inline SVG Iconography Architecture', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /svg class="[^"]*lucide-message-square/, 'Missing Lucide message-square SVG');
  assert.match(html, /svg class="[^"]*lucide-menu/, 'Missing Lucide menu SVG');
  assert.match(html, /svg class="[^"]*lucide-x/, 'Missing Lucide x SVG');
  assert.match(html, /svg class="[^"]*lucide-users/, 'Missing Lucide users SVG');
  assert.match(html, /svg class="[^"]*lucide-smile/, 'Missing Lucide smile SVG');
  assert.match(html, /svg class="[^"]*lucide-send/, 'Missing Lucide send SVG');
  assert.match(html, /svg class="[^"]*lucide-arrow-down/, 'Missing Lucide arrow-down SVG');

  const themeJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/theme.js'), 'utf8');
  assert.match(themeJs, /lucide-sun/, 'theme.js must use Lucide sun SVG');
  assert.match(themeJs, /lucide-moon/, 'theme.js must use Lucide moon SVG');
});

test('Sprint 8 Gate 2 - Emoji Module API on window.Chatter.emoji', () => {
  const emojiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/emoji.js'), 'utf8');
  assert.match(emojiJs, /window\.Chatter\.emoji\s*=/);
  assert.match(emojiJs, /getEmojis\s*\(/);
  assert.match(emojiJs, /renderPicker\s*\(/);
  assert.match(emojiJs, /insertEmoji\s*\(/);
  assert.match(emojiJs, /isOpen\s*\(/);
  assert.match(emojiJs, /openPicker\s*\(/);
  assert.match(emojiJs, /closePicker\s*\(/);
  assert.match(emojiJs, /togglePicker\s*\(/);
  assert.match(emojiJs, /bindEvents\s*\(/);
  assert.match(emojiJs, /init\s*\(/);
});

test('Sprint 8 Gate 3 - Emoji Caret-Preserving Insertion & Synthetic Input Event', () => {
  const emojiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/emoji.js'), 'utf8');
  assert.match(emojiJs, /selectionStart/);
  assert.match(emojiJs, /selectionEnd/);
  assert.match(emojiJs, /setSelectionRange/);
  assert.match(emojiJs, /dispatchEvent\s*\(\s*new\s+Event\s*\(\s*['"]input['"]/);
});

test('Sprint 8 Gate 4 - Semantic HTML Character Counter and Constraints', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /id="emoji-picker"/);
  assert.match(html, /id="emoji-toggle-btn"/);
  assert.match(html, /id="emoji-grid"/);
  assert.match(html, /id="char-counter"/);
  assert.match(html, /maxlength="25"/);
  assert.match(html, /maxlength="500"/);
  assert.match(html, /aria-controls="emoji-picker"/);
});

test('Sprint 8 Gate 5 - UI Module Character Counter & Threshold Mechanics', () => {
  const uiJs = fs.readFileSync(path.join(ROOT_DIR, 'public/js/ui.js'), 'utf8');
  assert.match(uiJs, /updateCharCounter\s*\(/);
  assert.match(uiJs, /charCounter/);
  assert.match(uiJs, /warning/);
  assert.match(uiJs, /danger/);
});

test('Sprint 8 Gate 6 - CSS Token Compliance & Micro-Interactions (Zero Hardcoded Colors)', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public/css/styles.css'), 'utf8');
  assert.match(css, /\.emoji-picker/);
  assert.match(css, /\.emoji-btn/);
  assert.match(css, /\.char-counter/);
  assert.match(css, /\.char-counter\.warning/);
  assert.match(css, /\.char-counter\.danger/);
  assert.match(css, /\.btn-send/);
  assert.match(css, /\.lucide/);

  // Validate zero hardcoded colors
  const lines = css.split('\n');
  let insideThemeBlock = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith(':root') || trimmed.startsWith('[data-theme=')) {
      insideThemeBlock = true;
    }
    if (insideThemeBlock && trimmed.endsWith('}')) {
      insideThemeBlock = false;
      return;
    }

    if (!insideThemeBlock) {
      const match = trimmed.match(/#[0-9a-fA-F]{3,6}|rgba?\(|hsla?\(/);
      assert.ok(!match, `Hardcoded color literal found at line ${index + 1}: ${trimmed}`);
    }
  });
});

test('Sprint 8 Gate 7 - Accessibility Landmarks & ARIA Attributes', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public/index.html'), 'utf8');
  assert.match(html, /role="log"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-label="[^"]*emoji[^"]*"/i);
});




