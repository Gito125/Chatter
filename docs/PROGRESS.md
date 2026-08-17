# Chatter Progress & Roadmap

This document outlines the phased development plan for the Chatter project.

---

### Phase 0: Bootstrap
- [ ] Initialize project with pnpm
- [ ] Create folder structure
- [ ] Set up Express server serving static files
- [ ] Add Socket.IO to server
- [ ] Create basic HTML shell
- [ ] Verify Socket.IO connection in browser console
> **Acceptance:** Server starts, serves HTML, Socket.IO connects (see console log)

### Phase 1: Core Messaging (MVP)
- [ ] Username modal — prompt for name on first visit
- [ ] Send messages — input field + send button
- [ ] Receive messages — display in chat area
- [ ] System messages — "X joined" / "X left"
- [ ] Basic styling — dark theme, layout structure
> **Acceptance:** Two browser tabs can chat with each other in real-time

### Phase 2: Standard Features
- [ ] Typing indicators — "X is typing..."
- [ ] Online users sidebar — list with status dots
- [ ] Message timestamps
- [ ] Auto-scroll with smart scroll detection
- [ ] Message grouping (consecutive messages from same user)
> **Acceptance:** Full chat experience with presence and typing

### Phase 3: Polish & Theming
- [ ] Light theme design
- [ ] Theme toggle with system detection
- [ ] Theme persistence (localStorage)
- [ ] Responsive layout — mobile hamburger menu
- [ ] Basic emoji support
- [ ] Lucide icons integration
- [ ] Connection status indicator (reconnecting...)
- [ ] Animations and micro-interactions
> **Acceptance:** Beautiful, responsive, themed chat app

### Phase 4: TypeScript Migration
- [ ] Set up TypeScript config
- [ ] Convert server code to TypeScript
- [ ] Convert client code to TypeScript (with bundler)
- [ ] Add type definitions for Socket.IO events
> **Acceptance:** Full TypeScript, all types explicit, no `any`

### Phase 5: PostgreSQL Persistence
- [ ] Set up PostgreSQL locally
- [ ] Design schema (users, messages tables)
- [ ] Swap memory store for PostgreSQL
- [ ] Message history on connect (load from DB)
- [ ] User sessions
> **Acceptance:** Messages persist across server restarts

### Phase 6: Deployment
- [ ] Choose hosting platform
- [ ] Configure environment variables
- [ ] Deploy and test with friends/family
- [ ] Set up auto-deploy from GitHub
> **Acceptance:** Live URL accessible to friends & family
