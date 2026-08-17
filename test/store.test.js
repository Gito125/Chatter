const test = require('node:test');
const assert = require('node:assert/strict');
const { store } = require('../src/store/memory');

test('Memory Store - User Management', (t) => {
  store.clearStore();

  // Test adding user
  const user = store.addUser({ id: 'socket_1', username: 'Alice' });
  assert.equal(user.id, 'socket_1');
  assert.equal(user.username, 'Alice');
  assert.ok(user.joinedAt);

  // Test getting user
  const retrieved = store.getUser('socket_1');
  assert.equal(retrieved.username, 'Alice');

  // Test getting all users
  const allUsers = store.getAllUsers();
  assert.equal(allUsers.length, 1);
  assert.equal(allUsers[0].username, 'Alice');

  // Test removing user
  const removed = store.removeUser('socket_1');
  assert.equal(removed.username, 'Alice');
  assert.equal(store.getUser('socket_1'), null);
  assert.equal(store.getAllUsers().length, 0);

  // Removing non-existent user returns null
  assert.equal(store.removeUser('non_existent'), null);
});

test('Memory Store - Input Validation', (t) => {
  store.clearStore();

  // Invalid socket ID
  assert.throws(() => store.addUser({ id: '', username: 'Alice' }), /Valid socket ID is required/);
  assert.throws(() => store.addUser({ id: null, username: 'Alice' }), /Valid socket ID is required/);

  // Invalid username
  assert.throws(() => store.addUser({ id: 's1', username: '' }), /Username must be between 1 and 25 characters/);
  assert.throws(() => store.addUser({ id: 's1', username: '   ' }), /Username must be between 1 and 25 characters/);
  assert.throws(() => store.addUser({ id: 's1', username: 'a'.repeat(26) }), /Username must be between 1 and 25 characters/);
});

test('Memory Store - Message Management and History Capping', (t) => {
  store.clearStore();

  // Test saving message
  const msg = store.saveMessage({ username: 'Alice', text: 'Hello world' });
  assert.ok(msg.id);
  assert.equal(msg.username, 'Alice');
  assert.equal(msg.text, 'Hello world');
  assert.ok(msg.timestamp);

  // Test recent messages
  const recent = store.getRecentMessages(10);
  assert.equal(recent.length, 1);
  assert.equal(recent[0].text, 'Hello world');

  // Test message history cap at 100
  store.clearStore();
  for (let i = 0; i < 110; i++) {
    store.saveMessage({ username: 'Alice', text: `Message ${i}` });
  }

  const cappedRecent = store.getRecentMessages(150);
  assert.equal(cappedRecent.length, 100);
  assert.equal(cappedRecent[0].text, 'Message 10');
  assert.equal(cappedRecent[99].text, 'Message 109');
});

test('Memory Store - Message Validation', (t) => {
  store.clearStore();

  // Empty username
  assert.throws(() => store.saveMessage({ username: '', text: 'hi' }), /Sender username is required/);

  // Empty or invalid text
  assert.throws(() => store.saveMessage({ username: 'Alice', text: '' }), /Message text must be between 1 and 500 characters/);
  assert.throws(() => store.saveMessage({ username: 'Alice', text: '   ' }), /Message text must be between 1 and 500 characters/);
  assert.throws(() => store.saveMessage({ username: 'Alice', text: 'a'.repeat(501) }), /Message text must be between 1 and 500 characters/);
});
