/**
 * Socket.IO Event Name Constants
 *
 * Centralized catalog of all WebSocket event identifiers.
 * Convention: domain:action (e.g., 'user:join', 'message:send')
 * Using constants prevents silent typo bugs across client and server.
 */
const EVENTS = Object.freeze({
  // Client -> Server
  USER_JOIN: 'user:join',
  MESSAGE_SEND: 'message:send',
  USER_TYPING: 'user:typing',

  // Server -> Client / Broadcast
  MESSAGE_RECEIVE: 'message:receive',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  USER_TYPING_UPDATE: 'user:typing',
  USERS_LIST: 'users:list',
  MESSAGE_HISTORY: 'message:history',
});

module.exports = { EVENTS };
