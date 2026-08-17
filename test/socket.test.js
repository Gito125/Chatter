const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const { registerSocketHandlers } = require('../src/socket/handlers');
const { EVENTS } = require('../src/socket/events');
const { store } = require('../src/store/memory');

let ioServer;
let httpServer;
let port;

const connectClient = () => {
  return new Promise((resolve) => {
    const socket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
    socket.on('connect', () => resolve(socket));
  });
};

test.before(async () => {
  const app = express();
  httpServer = http.createServer(app);
  ioServer = new Server(httpServer);
  registerSocketHandlers(ioServer);

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => ioServer.close(resolve));
  await new Promise((resolve) => httpServer.close(resolve));
});

test.beforeEach(() => {
  store.clearStore();
});

test('Socket Flow - User Join and Broadcast', async () => {
  const client1 = await connectClient();
  const client2 = await connectClient();

  const joinedPromise = new Promise((resolve) => {
    client2.on(EVENTS.USER_JOINED, (data) => resolve(data));
  });

  const usersListPromise = new Promise((resolve) => {
    client1.on(EVENTS.USERS_LIST, (data) => resolve(data));
  });

  const ack = await new Promise((resolve) => {
    client1.emit(EVENTS.USER_JOIN, { username: 'Alice' }, resolve);
  });

  assert.ok(ack.success);
  assert.equal(ack.user.username, 'Alice');

  // Verify client1 received USERS_LIST snapshot
  const initialSnapshot = await usersListPromise;
  assert.ok(Array.isArray(initialSnapshot.users));
  assert.equal(initialSnapshot.users.length, 1);
  assert.equal(initialSnapshot.users[0].username, 'Alice');

  // Verify client2 received USER_JOINED broadcast
  const broadcastData = await joinedPromise;
  assert.equal(broadcastData.username, 'Alice');
  assert.equal(broadcastData.users.length, 1);
  assert.equal(broadcastData.users[0].username, 'Alice');

  client1.disconnect();
  client2.disconnect();
});

test('Socket Flow - Multi-Client Presence Roster Snapshot and Departure Sync', async () => {
  const client1 = await connectClient();
  const client2 = await connectClient();
  const client3 = await connectClient();

  // Client 1 joins as Alice
  await new Promise((resolve) => client1.emit(EVENTS.USER_JOIN, { username: 'Alice' }, resolve));

  // Client 1 sets up listener for Client 2 arrival
  const c1BobJoinedPromise = new Promise((resolve) => {
    client1.once(EVENTS.USER_JOINED, (data) => resolve(data));
  });

  // Client 2 joins as Bob - Client 2 should receive [Alice, Bob] in users:list snapshot
  const c2SnapshotPromise = new Promise((resolve) => {
    client2.once(EVENTS.USERS_LIST, (data) => resolve(data));
  });

  await new Promise((resolve) => client2.emit(EVENTS.USER_JOIN, { username: 'Bob' }, resolve));

  const c2Snapshot = await c2SnapshotPromise;
  assert.equal(c2Snapshot.users.length, 2);
  const c2Usernames = c2Snapshot.users.map(u => u.username).sort();
  assert.deepEqual(c2Usernames, ['Alice', 'Bob']);

  const bobJoinedData = await c1BobJoinedPromise;
  assert.equal(bobJoinedData.username, 'Bob');
  assert.equal(bobJoinedData.users.length, 2);

  // Client 3 joins as Charlie
  const c1CharlieJoinedPromise = new Promise((resolve) => {
    client1.once(EVENTS.USER_JOINED, (data) => resolve(data));
  });
  await new Promise((resolve) => client3.emit(EVENTS.USER_JOIN, { username: 'Charlie' }, resolve));
  const c1JoinedData = await c1CharlieJoinedPromise;
  assert.equal(c1JoinedData.username, 'Charlie');
  assert.equal(c1JoinedData.users.length, 3);

  // Client 2 (Bob) leaves
  const c1LeftPromise = new Promise((resolve) => {
    client1.once(EVENTS.USER_LEFT, (data) => resolve(data));
  });
  const c3LeftPromise = new Promise((resolve) => {
    client3.once(EVENTS.USER_LEFT, (data) => resolve(data));
  });

  client2.disconnect();

  const c1LeftData = await c1LeftPromise;
  const c3LeftData = await c3LeftPromise;

  assert.equal(c1LeftData.username, 'Bob');
  assert.equal(c1LeftData.users.length, 2);
  const remaining = c1LeftData.users.map(u => u.username).sort();
  assert.deepEqual(remaining, ['Alice', 'Charlie']);

  assert.equal(c3LeftData.username, 'Bob');
  assert.equal(c3LeftData.users.length, 2);

  client1.disconnect();
  client3.disconnect();
});

test('Socket Flow - Two Clients Bidirectional Messaging', async () => {
  const client1 = await connectClient();
  const client2 = await connectClient();

  await new Promise((resolve) => client1.emit(EVENTS.USER_JOIN, { username: 'Alice' }, resolve));
  await new Promise((resolve) => client2.emit(EVENTS.USER_JOIN, { username: 'Bob' }, resolve));

  const c1ReceivedPromise = new Promise((resolve) => {
    client1.on(EVENTS.MESSAGE_RECEIVE, (msg) => resolve(msg));
  });
  const c2ReceivedPromise = new Promise((resolve) => {
    client2.on(EVENTS.MESSAGE_RECEIVE, (msg) => resolve(msg));
  });

  const sendAck = await new Promise((resolve) => {
    client2.emit(EVENTS.MESSAGE_SEND, { text: 'Hello from Bob' }, resolve);
  });

  assert.ok(sendAck.success);
  assert.equal(sendAck.message.text, 'Hello from Bob');

  const msg1 = await c1ReceivedPromise;
  const msg2 = await c2ReceivedPromise;

  assert.equal(msg1.username, 'Bob');
  assert.equal(msg1.text, 'Hello from Bob');
  assert.equal(msg2.username, 'Bob');
  assert.equal(msg2.text, 'Hello from Bob');

  client1.disconnect();
  client2.disconnect();
});

test('Adversarial Scenario - Unregistered socket message send is rejected', async () => {
  const client = await connectClient();

  const ack = await new Promise((resolve) => {
    client.emit(EVENTS.MESSAGE_SEND, { text: 'I have not joined yet' }, resolve);
  });

  assert.ok(ack.error);
  assert.match(ack.error, /Unauthorized/);

  client.disconnect();
});

test('Adversarial Scenario - Whitespace-only or invalid messages rejected', async () => {
  const client = await connectClient();
  await new Promise((resolve) => client.emit(EVENTS.USER_JOIN, { username: 'Alice' }, resolve));

  const ack = await new Promise((resolve) => {
    client.emit(EVENTS.MESSAGE_SEND, { text: '   ' }, resolve);
  });

  assert.ok(ack.error);
  assert.match(ack.error, /Message must be between 1 and 500 characters/);

  client.disconnect();
});

test('Adversarial Scenario - Invalid username rejected', async () => {
  const client = await connectClient();

  const ack1 = await new Promise((resolve) => {
    client.emit(EVENTS.USER_JOIN, { username: '' }, resolve);
  });
  assert.ok(ack1.error);
  assert.match(ack1.error, /Username must be between 1 and 25 characters/);

  const ack2 = await new Promise((resolve) => {
    client.emit(EVENTS.USER_JOIN, { username: 'a'.repeat(30) }, resolve);
  });
  assert.ok(ack2.error);
  assert.match(ack2.error, /Username must be between 1 and 25 characters/);

  client.disconnect();
});

test('Adversarial Scenario - Disconnect before join emits no phantom user:left', async () => {
  const listener = await connectClient();
  await new Promise((resolve) => listener.emit(EVENTS.USER_JOIN, { username: 'Listener' }, resolve));

  let phantomReceived = false;
  listener.on(EVENTS.USER_LEFT, () => {
    phantomReceived = true;
  });

  const anonymous = await connectClient();
  anonymous.disconnect();

  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.equal(phantomReceived, false);
  listener.disconnect();
});
