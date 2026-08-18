# Contributing to Chatter

Thank you for your interest in contributing to Chatter! This guide outlines the development workflow, branching strategy, commit conventions, testing expectations, and architectural standards used across the codebase.

---

## 1. Development Environment Setup

### Prerequisites

Ensure you have the following tools installed on your development machine:
- **Node.js**: `v18.0.0` or higher
- **pnpm**: `v8.0.0` or higher (Chatter strictly uses `pnpm` as its package manager; do not use `npm` or `yarn`)
- **Git**: `2.30+`

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/chatter.git
   cd chatter
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm dev
   ```
   The application will be accessible at [http://localhost:3000](http://localhost:3000) with Node.js `--watch` enabled for auto-reloading on backend file changes.

---

## 2. Branching Strategy & Sprint Workflow

Chatter follows an incremental sprint-based branching workflow. All development is organized into isolated, single-purpose branches following the `sprint-N-slug` naming convention, merged into `main` using non-fast-forward (`--no-ff`) merge commits to preserve clear historical boundaries.

### Branch Naming Scheme

Format: `sprint-<number>-<short-descriptive-slug>`

Examples:
- `sprint-1-endtoend-core-realtime`
- `sprint-2-realtime-presence-live`
- `sprint-3-realtime-typing-indicators`
- `sprint-4-message-stream-polish`
- `sprint-5-dualtheme-engine-hsl`
- `sprint-6-mobilefirst-responsive-layout`
- `sprint-7-network-resilience-connection`
- `sprint-8-interactive-polish-lucide`

For standard bugfixes or external PRs outside scheduled sprints, use:
- `fix/<issue-description>`
- `feat/<feature-description>`
- `docs/<documentation-topic>`

### Workflow Steps

1. **Branch from latest `main`**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b sprint-9-multichannel-rooms
   ```

2. **Develop incrementally** with atomic commits.
3. **Run local test suites** and ensure 100% pass rate.
4. **Merge with `--no-ff`** (or open a Pull Request configured for merge commit):
   ```bash
   git checkout main
   git merge --no-ff sprint-9-multichannel-rooms -m "Merge sprint-9-multichannel-rooms into main"
   ```

---

## 3. Commit Message Conventions

Chatter adheres strictly to the [Conventional Commits](https://www.conventionalcommits.org/) specification. Each commit must represent a single, atomic logical change.

### Format

```
<type>(<scope>): <short imperative summary>

[optional body explaining motivation and context]

[optional footer(s)]
```

### Allowed Types

| Type | Description | Example |
|---|---|---|
| `feat` | A new user-facing feature or capability | `feat(typing): add debounced peer typing indicator` |
| `fix` | A bug fix or defect resolution | `fix(store): prevent duplicate usernames case-insensitively` |
| `refactor` | Code restructuring without feature or bug changes | `refactor(ui): extract message grouping calculation` |
| `test` | Adding missing tests or refactoring test suites | `test(socket): add reconnection handshake assertion` |
| `docs` | Documentation changes or additions | `docs(architecture): document socket data flow lifecycles` |
| `style` | Formatting, whitespace, or non-functional styling | `style(css): format custom property token declarations` |
| `chore` | Build tasks, package updates, or sprint housekeeping | `chore(sprint-8): mark sprint complete` |

### Rules
- Use lowercase for types and scopes.
- Write the summary in the imperative mood ("add", not "added" or "adds").
- Do not end the subject line with a period.

---

## 4. Local Testing & Quality Verification

Before submitting any Pull Request or merging a branch into `main`, you must run all automated test suites to ensure zero regressions.

### 1. Unit, Store & Socket Integration Tests
Executes memory store assertions, WebSocket protocol verification, and architectural rubric gate tests:
```bash
pnpm test
```
*Expected: 100% passing tests (0 failures, 0 skipped).*

### 2. End-to-End Browser Tests (Playwright)
Runs the full suite of headless browser tests across all features:
```bash
pnpm exec playwright test
```
To run a specific test suite or test file:
```bash
pnpm exec playwright test e2e/theme.spec.js
```

---

## 5. Architectural Standards & Code Conventions

All contributions must follow the core project conventions established in [`AGENTS.md`](file:///home/gideon/Documents/CODE/Projects/Chatter/AGENTS.md):

### JavaScript & Backend (Node.js / Express)
- **ES6+ Standards**: Use modern syntax (destructuring, arrow functions, template literals, optional chaining).
- **No `var`**: Use `const` by default; use `let` strictly when variable reassignment is required.
- **Early Returns**: Favor guard clauses and early returns to eliminate deep nesting.
- **Functional Patterns**: Prefer pure functional patterns and plain object factories over class hierarchies where possible.
- **Minimal `server.js`**: Keep `src/server.js` minimal; delegate Socket.IO routing and handlers to `src/socket/handlers.js`.
- **No SSR**: Express serves static assets from `public/`; all UI rendering is executed on the client.

### Socket.IO Protocol
- **Event Constants**: Never hardcode socket event strings. Every event name must be imported from [`src/socket/events.js`](file:///home/gideon/Documents/CODE/Projects/Chatter/src/socket/events.js).
- **Naming Standard**: Event names must follow the `domain:action` convention (e.g., `user:join`, `message:send`, `user:typing`).
- **Payload Validation**: Always validate payload types, lengths, and sender authorization on the server before dispatching or persisting.

### Data Access Layer (DAL)
- **Store Encapsulation**: All data storage interactions must route through [`src/store/memory.js`](file:///home/gideon/Documents/CODE/Projects/Chatter/src/store/memory.js). Handlers must never access or mutate private internal collections directly.
- **Database Readiness**: Keep the store API functional and clean to enable zero-downtime migration to PostgreSQL in future phases.

### Frontend Architecture (Vanilla Modular JS)
- **Namespace Sharing**: The client is structured into modular scripts (`app.js`, `socket.js`, `ui.js`, `theme.js`, `emoji.js`) communicating via the global `window.Chatter` namespace.
- **Separation of Concerns**: Do not mix DOM manipulation into `socket.js` or network calls into `ui.js`.
- **XSS Prevention**: Never assign untrusted user input to `innerHTML`. Always use `textContent`, `document.createElement`, and safe `setAttribute`.

### CSS & Design Tokens
- **Zero Hardcoded Colors**: All component styles must reference CSS Custom Properties defined on `:root`, `[data-theme="dark"]`, and `[data-theme="light"]` in [`public/css/styles.css`](file:///home/gideon/Documents/CODE/Projects/Chatter/public/css/styles.css).
- **Mobile-First Layout**: Mobile viewports (≤768px) form the baseline layout; desktop enhancements are added via `@media (min-width: 768px)`.
- **Sizing Units**: Use `rem` for typography, `px` for borders and micro-spacing, and `rem`/`%`/`100dvh` for fluid layouts.

### Comments & Documentation
- Explain the **why**, not the obvious **what**.
- Include `Learning Note:` comments where architectural patterns (e.g., debouncing, DAL, safe DOM insertion) offer valuable context for learners.

---

## 6. Submitting a Pull Request

1. Push your branch to GitHub.
2. Open a Pull Request targeting `main`.
3. Fill out the PR description with:
   - Summary of changes and motivation.
   - List of test cases verified.
   - Any architectural notes or breaking changes.
4. Ensure all CI test suites and Playwright checks pass.
