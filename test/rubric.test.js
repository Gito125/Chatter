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

