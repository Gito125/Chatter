# Detailed Socket.IO Event Design

## Complete Event Catalog

### `user:join`
- **Direction:** Client → Server
- **Payload Schema:** `{ username: string }`
- **Example Payload:** `{"username": "Gideon"}`
- **Trigger:** Fires when the user submits their username in the initial modal.
- **Receiver:** Server.

### `message:send`
- **Direction:** Client → Server
- **Payload Schema:** `{ text: string }`
- **Example Payload:** `{"text": "Hello world!"}`
- **Trigger:** Fires when the user submits a message in the chat input.
- **Receiver:** Server.

### `user:typing` (Client to Server)
- **Direction:** Client → Server
- **Payload Schema:** `{ isTyping: boolean }`
- **Example Payload:** `{"isTyping": true}`
- **Trigger:** Fires when the user starts typing, and again with `false` when they stop or send a message.
- **Receiver:** Server.

### `message:receive`
- **Direction:** Server → Client
- **Payload Schema:** `{ id: string, username: string, text: string, timestamp: string }`
- **Example Payload:** `{"id": "msg-1234", "username": "Gideon", "text": "Hello world!", "timestamp": "2024-08-17T19:41:50.000Z"}`
- **Trigger:** Fires immediately after the server processes a valid `message:send`.
- **Receiver:** All connected clients (Broadcast).

### `user:joined`
- **Direction:** Server → Client
- **Payload Schema:** `{ username: string, users: User[] }`
- **Example Payload:** `{"username": "Gideon", "users": [{"id": "socket123", "username": "Gideon", "joinedAt": "2024-08-17T19:41:50.000Z"}]}`
- **Trigger:** Fires after a new user successfully completes a `user:join`.
- **Receiver:** All connected clients (Broadcast).

### `user:left`
- **Direction:** Server → Client
- **Payload Schema:** `{ username: string, users: User[] }`
- **Example Payload:** `{"username": "Gideon", "users": []}`
- **Trigger:** Fires when a client disconnects.
- **Receiver:** All connected clients except the disconnected one.

### `user:typing` (Server to Client)
- **Direction:** Server → Client
- **Payload Schema:** `{ username: string, isTyping: boolean }`
- **Example Payload:** `{"username": "Gideon", "isTyping": true}`
- **Trigger:** Server relays a `user:typing` event from one client.
- **Receiver:** All connected clients *except* the sender.

### `users:list`
- **Direction:** Server → Client
- **Payload Schema:** `{ users: User[] }`
- **Example Payload:** `{"users": [...]}`
- **Trigger:** Dispatched immediately upon a successful `user:join`.
- **Receiver:** Only the specific client that just joined.

### `message:history`
- **Direction:** Server → Client
- **Payload Schema:** `{ messages: Message[] }`
- **Example Payload:** `{"messages": [...]}`
- **Trigger:** Dispatched immediately upon a successful `user:join`.
- **Receiver:** Only the specific client that just joined.

---

## Connection Lifecycle Flow
1. Client connects → Server assigns `socket.id`.
2. Client emits `user:join` with username.
3. Server stores the user and broadcasts `user:joined` to **ALL** clients.
4. Server sends `message:history` to the **NEW** client only.
5. Server sends `users:list` to the **NEW** client only.
6. User actively participates (chats, triggers typing indicators).
7. Client disconnects → Server removes the user and broadcasts `user:left` to **ALL** remaining clients.

---

## Example Message Flow
```text
Client A emits: message:send { text: "Hello everyone!" }
Server creates: { id: "abc123", username: "Gideon", text: "Hello everyone!", timestamp: "2024-08-17T19:41:50Z" }
Server broadcasts to ALL: message:receive { id: "abc123", username: "Gideon", text: "Hello everyone!", timestamp: "2024-08-17T19:41:50Z" }
```

---

## Typing Indicator Flow
```text
Client A emits: user:typing { isTyping: true }
Server broadcasts to ALL EXCEPT A: user:typing { username: "Gideon", isTyping: true }

(after 3 seconds of no keypress, or immediately on message send)
Client A emits: user:typing { isTyping: false }
Server broadcasts to ALL EXCEPT A: user:typing { username: "Gideon", isTyping: false }
```

---

## Error Handling

- **Duplicate Username:**
  - If a user tries to join with a username that is already taken, the server can emit an error event or acknowledgement to reject the `user:join` event. The client should prompt for a different name.
  
- **Empty Message:**
  - Empty or whitespace-only messages emitted via `message:send` are ignored by the server. The client UI must also prevent sending them.

- **Disconnection During Typing:**
  - If a user disconnects while their `isTyping` status is `true`, the server cleans up their session and broadcasts `user:left`. The client interprets `user:left` as a signal to clear any active typing indicators for that user.
