# Architecture Decision Records (ADRs)

This document tracks major architectural and technical decisions made for the **Chatter** project.

---

## 1. Vanilla HTML/CSS/JS over React/Vue

- **Context**: Choosing the frontend stack for a learning-focused real-time chat application.
- **Decision**: We will use plain HTML, CSS, and Vanilla JavaScript without a frontend framework.
- **Rationale**: The goal is to understand fundamentals before adding layers of abstraction. Frameworks like React require a build step and obscure raw DOM manipulation. This approach ensures a deep understanding of browser APIs and event handling.
- **Consequences**:
  - **Positive**: Simpler learning curve, no build step required, deeper understanding of the DOM.
  - **Negative**: No component reuse, manual DOM manipulation can become verbose, harder to manage complex state.

## 2. Socket.IO over raw WebSockets

- **Context**: Choosing the real-time communication protocol.
- **Decision**: We will use Socket.IO instead of the native browser WebSocket API.
- **Rationale**: While native WebSockets are powerful, Socket.IO provides crucial features out-of-the-box: auto-reconnection, fallback to HTTP long-polling (for restrictive networks), rooms/namespaces, and a clean event-based API. Building these features manually over raw WebSockets is complex and error-prone.
- **Consequences**:
  - **Positive**: Faster development, robust connection handling, easy broadcasting.
  - **Negative**: Adds a library dependency on both client and server, abstracts away the raw wire protocol.

## 3. pnpm over npm/yarn

- **Context**: Choosing a package manager for the Node.js backend.
- **Decision**: We will use `pnpm`.
- **Rationale**: `pnpm` uses a global store and hard links, making it significantly faster and more disk-efficient than npm or yarn. It also enforces strict dependency resolution, preventing "phantom dependencies" where you accidentally rely on a package installed by another dependency.
- **Consequences**:
  - **Positive**: Fast installs, saves disk space, catches dependency errors early.
  - **Negative**: Slightly less mainstream than npm, occasionally requires configuration tweaks for complex monorepos (not an issue here).

## 4. CSS Custom Properties for Theming

- **Context**: Implementing dark/light themes.
- **Decision**: We will use native CSS Custom Properties (Variables) toggled via a data attribute on the `<html>` or `<body>` tag.
- **Rationale**: CSS Custom properties have excellent browser support and require no build step (unlike SASS/SCSS). Toggling a single attribute (e.g., `data-theme="dark"`) is simple and performant.
- **Consequences**:
  - **Positive**: Native browser support, no compilation, easy to inspect in dev tools.
  - **Negative**: No compile-time checking for variable names, manual variable management.

## 5. Lucide Icons (inline SVG)

- **Context**: Selecting an iconography library.
- **Decision**: We will use Lucide Icons, specifically injecting them as inline SVGs.
- **Rationale**: Lucide is a beautiful, consistent, and lightweight open-source icon set. By using inline SVGs (or a lightweight CDN script), we keep the UI clean and tree-shakeable without loading a massive font file like FontAwesome.
- **Consequences**:
  - **Positive**: Lightweight, consistent design, easy to style with CSS (`stroke` / `fill`).
  - **Negative**: Need to manage SVG markup in HTML or rely on a client-side script to inject them.

## 6. Phased TypeScript Migration

- **Context**: Deciding when/if to introduce TypeScript.
- **Decision**: We will start with JavaScript and migrate to TypeScript in Phase 4.
- **Rationale**: Starting with plain JS reduces cognitive overload during the initial setup and core logic implementation. Once the app works, migrating to TS will clearly demonstrate the value of static typing in a refactor context.
- **Consequences**:
  - **Positive**: Easier initial learning curve, demonstrates the "why" of TypeScript clearly later on.
  - **Negative**: Initial code lacks type safety, requires writing code twice (JS then TS).

## 7. Phased PostgreSQL Migration

- **Context**: Deciding how to store user and message data.
- **Decision**: We will start with an in-memory data store, heavily abstracted, and migrate to PostgreSQL in Phase 5.
- **Rationale**: Setting up a database early can derail momentum. An in-memory store allows rapid prototyping of the Socket logic. By abstracting the store early, swapping in Postgres later becomes a localized task rather than a whole-app rewrite.
- **Consequences**:
  - **Positive**: Fast initial development, clear demonstration of the Repository/Store pattern.
  - **Negative**: Messages and user sessions are lost on server restart until Phase 5 is complete.

## 8. Modular Frontend JS (no bundler)

- **Context**: Organizing client-side JavaScript without a build step.
- **Decision**: Split client code into focused modules (`app.js`, `socket.js`, `ui.js`) loaded via sequential `<script>` tags in HTML.
- **Rationale**: Keeps files small and responsibilities clear. It avoids the complexity of Webpack/Vite for a beginner project while still enforcing Separation of Concerns.
- **Consequences**:
  - **Positive**: Clean file structure, simple mental model, no build step.
  - **Negative**: Pollutes the global scope (modules must communicate via a global object like `window.Chatter`), no tree-shaking, requires careful ordering of script tags in HTML.
