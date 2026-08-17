# Chatter

Chatter is a lightweight, responsive real-time web chat application built with **Node.js**, **Express**, **Socket.IO**, and **Vanilla HTML/CSS/JavaScript**.

## Features (Sprint 1 MVP)

- **Real-Time Bidirectional Messaging**: Instant message broadcast via Socket.IO.
- **Username Registration**: Modal prompt with input validation (1–25 chars).
- **Safe DOM Rendering**: Strict XSS prevention using safe DOM property assignment.
- **Zero-Build Vanilla Architecture**: Modular frontend scripts orchestrated via `window.Chatter`.
- **CSS Design System**: Built with CSS Custom Properties and zero hardcoded colors in component rules.
- **Data Access Abstraction**: Encapsulated in-memory store decoupling network handlers from data storage.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Running the Server

```bash
# Start server
pnpm start

# Start server in dev mode with auto-reload
pnpm dev
```

Open your browser at [http://localhost:3000](http://localhost:3000).

### Running Automated Tests

```bash
pnpm test
```

## Project Architecture

```
Chatter/
├── public/                  # Static frontend assets served by Express
│   ├── css/
│   │   └── styles.css       # Design tokens and responsive chat layout
│   ├── js/
│   │   ├── app.js           # Bootstrap coordinator & event wiring
│   │   ├── socket.js        # Socket.IO client interface
│   │   ├── ui.js            # DOM manipulation & safe rendering
│   │   ├── theme.js         # Theme management
│   │   └── emoji.js         # Emoji support stub
│   └── index.html           # HTML5 shell & modal
├── src/                     # Backend Node.js codebase
│   ├── server.js            # Express & Socket.IO server entry point
│   ├── socket/
│   │   ├── events.js        # Domain:action event constants
│   │   └── handlers.js      # Socket event handlers & validators
│   └── store/
│       └── memory.js        # In-memory store abstraction (DAL)
├── package.json
└── AGENTS.md
```
