/**
 * In-Memory Data Store
 *
 * Encapsulates users and messages in private collections behind functional accessors.
 * This abstraction decouples network handlers from storage details, enabling a
 * seamless transition to a persistent database (such as PostgreSQL) in later phases.
 *
 * Learning Note:
 * The Data Access Layer (DAL) pattern keeps business logic separated from storage
 * mechanics. Handlers interact solely through exported methods rather than mutating
 * raw arrays or maps directly.
 */

// Private internal collections
const users = new Map();
const messages = [];
const MAX_MESSAGE_HISTORY = 100;

/**
 * Generate a unique message identifier.
 * @returns {string} Unique message ID
 */
const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
};

/**
 * Check whether a username is already taken by another active user.
 * Performs a case-insensitive comparison.
 * @param {string} username - Candidate username
 * @param {string} [excludeSocketId=null] - Optional socket ID to exclude from check
 * @returns {boolean} True if username is already registered
 */
const isUsernameTaken = (username, excludeSocketId = null) => {
  if (!username || typeof username !== 'string') return false;
  const normalized = username.trim().toLowerCase();
  if (!normalized) return false;

  for (const user of users.values()) {
    if (excludeSocketId && user.id === excludeSocketId) {
      continue;
    }
    if (user.username.toLowerCase() === normalized) {
      return true;
    }
  }
  return false;
};

/**
 * Retrieve a user record by username (case-insensitive).
 * @param {string} username - Username to look up
 * @returns {Object|null} User record if found, or null
 */
const getUserByUsername = (username) => {
  if (!username || typeof username !== 'string') return null;
  const normalized = username.trim().toLowerCase();
  if (!normalized) return null;

  for (const user of users.values()) {
    if (user.username.toLowerCase() === normalized) {
      return user;
    }
  }
  return null;
};

/**
 * Register a user in the in-memory store.
 * @param {Object} params
 * @param {string} params.id - Socket connection ID
 * @param {string} params.username - User display name (1-25 characters)
 * @returns {Object} Created User record
 */
const addUser = ({ id, username }) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Valid socket ID is required');
  }

  const trimmedUsername = (username || '').trim();
  if (!trimmedUsername || trimmedUsername.length > 25) {
    throw new Error('Username must be between 1 and 25 characters');
  }

  if (isUsernameTaken(trimmedUsername, id)) {
    throw new Error('Username is already taken');
  }

  const user = {
    id,
    username: trimmedUsername,
    joinedAt: new Date().toISOString(),
  };

  users.set(id, user);
  return user;
};

/**
 * Retrieve a user record by socket ID.
 * @param {string} id - Socket ID
 * @returns {Object|null} User record if found, or null
 */
const getUser = (id) => {
  if (!id) return null;
  return users.get(id) || null;
};

/**
 * Remove a user from the store upon disconnection.
 * @param {string} id - Socket ID
 * @returns {Object|null} Removed User record if found, or null
 */
const removeUser = (id) => {
  if (!id) return null;
  const user = users.get(id) || null;
  if (user) {
    users.delete(id);
  }
  return user;
};

/**
 * Retrieve all currently active users as a list.
 * @returns {Array<Object>} List of active User objects
 */
const getAllUsers = () => {
  return Array.from(users.values());
};

/**
 * Save a new message to the in-memory buffer.
 * Capped at MAX_MESSAGE_HISTORY records to prevent unbounded memory growth.
 * @param {Object} params
 * @param {string} params.username - Sender username
 * @param {string} params.text - Message content (1-500 characters)
 * @returns {Object} Created Message record
 */
const saveMessage = ({ username, text }) => {
  const trimmedUsername = (username || '').trim();
  const trimmedText = (text || '').trim();

  if (!trimmedUsername) {
    throw new Error('Sender username is required');
  }

  if (!trimmedText || trimmedText.length > 500) {
    throw new Error('Message text must be between 1 and 500 characters');
  }

  const message = {
    id: generateMessageId(),
    username: trimmedUsername,
    text: trimmedText,
    timestamp: new Date().toISOString(),
  };

  messages.push(message);

  // Maintain circular buffer limit
  if (messages.length > MAX_MESSAGE_HISTORY) {
    messages.shift();
  }

  return message;
};

/**
 * Retrieve the most recent messages up to the requested limit.
 * @param {number} [limit=50] - Number of messages to retrieve
 * @returns {Array<Object>} Recent messages
 */
const getRecentMessages = (limit = 50) => {
  const safeLimit = Math.max(1, Math.min(limit, MAX_MESSAGE_HISTORY));
  return messages.slice(-safeLimit);
};

/**
 * Clear all internal collections (used in automated test resets).
 */
const clearStore = () => {
  users.clear();
  messages.length = 0;
};

const store = {
  addUser,
  getUser,
  removeUser,
  getAllUsers,
  isUsernameTaken,
  getUserByUsername,
  saveMessage,
  getRecentMessages,
  clearStore,
};

module.exports = {
  store,
  addUser,
  getUser,
  removeUser,
  getAllUsers,
  isUsernameTaken,
  getUserByUsername,
  saveMessage,
  getRecentMessages,
  clearStore,
};
