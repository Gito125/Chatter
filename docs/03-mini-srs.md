# System Requirements Specification (Mini-SRS) - Chatter

## High-Level Architecture Diagram
```mermaid
flowchart LR
    BrowserA[Browser\nClient A] <-->|WebSocket| Server[Express + Socket.IO Server]
    BrowserB[Browser\nClient B] <-->|WebSocket| Server
    Server <--> InMem[(In-Memory Store\nusers[], messages[])]
```

## Locked Tech Stack
- **Runtime:** Node.js 18+
- **Server Framework:** Express 4.x
- **Real-time:** Socket.IO 4.x (server) + socket.io-client 4.x (client)
- **Icons:** Lucide (inline SVGs)
- **Package Manager:** pnpm
- **Frontend Build Step:** None (vanilla HTML/CSS/JS served as static files)

## Socket.IO Event Contract

**Client → Server Events:**
| Event | Payload | Description |
|---|---|---|
| `user:join` | `{ username: string }` | User sets their username and joins the chat |
| `message:send` | `{ text: string }` | User sends a chat message |
| `user:typing` | `{ isTyping: boolean }` | User starts/stops typing |

**Server → Client Events:**
| Event | Payload | Description |
|---|---|---|
| `message:receive` | `{ id: string, username: string, text: string, timestamp: string }` | A new message to display |
| `user:joined` | `{ username: string, users: User[] }` | A user joined, updated user list |
| `user:left` | `{ username: string, users: User[] }` | A user left, updated user list |
| `user:typing` | `{ username: string, isTyping: boolean }` | Someone is typing |
| `users:list` | `{ users: User[] }` | Full current user list (on connect) |
| `message:history` | `{ messages: Message[] }` | Recent message history (on connect) |

## Data Models (Phase 1: In-Memory)
```typescript
type User = {
  id: string; // socket.id
  username: string;
  joinedAt: Date;
};

type Message = {
  id: string; // uuid
  username: string;
  text: string;
  timestamp: Date;
};
```

## Theme System Specification
- **Implementation:** CSS custom properties on the `[data-theme]` attribute of the `<html>` element.
- **Dark Theme Colors:** Deep backgrounds, lighter text, dark surface colors.
- **Light Theme Colors:** White/light gray backgrounds, dark text, light surface colors.
- **System Detection:** Uses `prefers-color-scheme` media query to detect the OS preference.
- **Manual Override:** A manual toggle button updates the theme and saves the preference to `localStorage` under the key `chatter-theme`.
- **Accent Color:** 
  - Dark Theme: Teal `hsl(174, 80%, 50%)`
  - Light Theme: Deep Teal `hsl(174, 80%, 35%)`

## Responsive Breakpoints
- **Desktop (> 768px):** Sidebar visible, full side-by-side layout (users list + main chat area).
- **Mobile (≤ 768px):** Sidebar hidden behind a hamburger menu overlay, full-width chat area.
