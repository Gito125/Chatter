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
