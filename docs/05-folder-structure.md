# Folder Structure

This document outlines the folder structure for **Chatter** and explains the reasoning behind this organization. This project is a learning exercise, and the structure is designed to be approachable while demonstrating good architectural practices.

## Complete Folder Structure

```
Chatter/
├── docs/                    # Planning & architecture documents
│   ├── 01-mini-vision.md
│   ├── 02-mini-prd.md
│   ├── 03-mini-srs.md
│   ├── 04-socket-events.md
│   ├── 05-folder-structure.md
│   ├── 06-adr-tech-decisions.md
│   └── PROGRESS.md
├── public/                  # Static frontend files (served by Express)
│   ├── index.html           # Main HTML file
│   ├── css/
│   │   └── styles.css       # All styles including theme variables
│   ├── js/
│   │   ├── app.js           # Main client-side application logic
│   │   ├── socket.js        # Socket.IO client connection and event handlers
│   │   ├── ui.js            # DOM manipulation and UI updates
│   │   ├── theme.js         # Theme detection, toggle, and persistence
│   │   └── emoji.js         # Basic emoji picker/support
│   └── assets/              # Static assets (favicon, etc.)
├── src/                     # Server-side code
│   ├── server.js            # Express + Socket.IO server entry point
│   ├── socket/
│   │   ├── handlers.js      # Socket event handler functions
│   │   └── events.js        # Event name constants (prevents typos)
│   └── store/
│       └── memory.js        # In-memory data store (users, messages)
├── AGENTS.md                # AI agent rules
├── package.json
├── pnpm-lock.yaml
├── .gitignore
└── README.md
```

## Directory Explanations & Rationale

### `docs/`
- **Contents:** Project planning, architecture decisions, and progress tracking.
- **Why:** Keeps the root clean and centralizes project context. Having a dedicated `docs` folder is standard practice for open-source and professional projects.

### `public/`
- **Contents:** All static assets (HTML, CSS, client-side JS, images).
- **Why:** This folder is configured in Express to be served directly to the client (`express.static('public')`). It explicitly separates code that runs in the browser from code that runs on the server.
- **Learning Note:** You will learn how basic web servers deliver static files without requiring a complex build process like Webpack or Vite.

### `public/js/` (Modular Frontend JS)
- **Contents:** Split JavaScript files (`app.js`, `socket.js`, `ui.js`, `theme.js`, `emoji.js`).
- **Why:** Instead of one massive `script.js` file, code is divided by responsibility. `ui.js` handles DOM manipulation, `socket.js` handles network events, etc.
- **Learning Note:** You will learn the principles of Separation of Concerns (SoC). Even without a bundler, organizing code into logical modules makes debugging and extending much easier.

### `src/`
- **Contents:** All server-side Node.js code.
- **Why:** Separates backend logic from frontend assets (`public`) and project metadata (root).

### `src/server.js`
- **Contents:** The entry point for the Node backend. Sets up Express, HTTP server, and initializes Socket.IO.
- **Why:** Kept intentionally small. It delegates socket event handling to the `socket/` directory.

### `src/socket/` (Handlers and Events)
- **Contents:** `handlers.js` (logic for when events are received) and `events.js` (constants for event names).
- **Why:** As a real-time app grows, the `server.js` file can quickly become hundreds of lines long if all socket logic is kept there. Moving this logic into `handlers.js` keeps the codebase scalable.
- **Learning Note:** `events.js` contains constants (e.g., `export const EVENTS = { MESSAGE_SEND: 'message:send' }`). You will learn why using variables instead of hardcoded strings prevents subtle, hard-to-find typo bugs in event-driven architectures.

### `src/store/`
- **Contents:** `memory.js` (handles saving users and messages in arrays).
- **Why:** Abstracting data access. Instead of the socket handlers pushing directly to an array (`messages.push(msg)`), they call a function (`store.saveMessage(msg)`).
- **Learning Note:** This pattern (Data Access Layer) is crucial. When it is time to upgrade to PostgreSQL in Phase 5, you only need to change the implementation inside the `store/` folder. The rest of the app (the socket handlers) won't even know the database changed.

### Root Files
- **`AGENTS.md`**: Custom instructions for AI coding assistants.
- **`package.json` & `pnpm-lock.yaml`**: Dependency definitions using `pnpm`.
- **`README.md`**: Project overview and setup instructions.
