# Chatter — Project Rules for AI Agents

## JavaScript (Phase 1-3)

- Use modern ES6+ syntax (const/let, arrow functions, template literals, destructuring).
- No `var`. Use `const` by default, `let` only when reassignment is needed.
- Use early returns to reduce nesting.
- Prefer functional patterns over class-based where possible.

## Socket.IO

- All event names must use constants from `src/socket/events.js` — never hardcode event strings.
- Event naming convention: `domain:action` (e.g., `message:send`, `user:join`).
- Server handlers live in `src/socket/handlers.js`, not in the main server file.
- Always validate payloads before processing.

## Express

- Express serves static files from `public/` directory.
- No server-side rendering — all UI is client-side.
- Keep `server.js` minimal — delegate Socket.IO setup to handler modules.

## CSS

- All colors must use CSS custom properties defined in the theme section of `styles.css`.
- Never use hardcoded color values in component styles.
- Mobile-first approach: base styles for mobile, `@media (min-width: 768px)` for desktop.
- Use `rem` for font sizes, `px` for borders and small spacing, `rem`/`%` for layout spacing.

## Frontend JavaScript

- Client code is split into modules: `app.js`, `socket.js`, `ui.js`, `theme.js`, `emoji.js`.
- Each module has a clear responsibility — don't mix DOM manipulation with socket logic.
- Use the global `Chatter` namespace to share state between modules.

## Data Store

- All data access goes through `src/store/memory.js`.
- Never access the users/messages arrays directly from handlers — use store functions.
- This abstraction enables the PostgreSQL migration in Phase 5.

## Comments

- Add moderate comments explaining major code blocks and function purposes.
- Explain the "why" not the "what" — don't comment obvious code.
- Add learning notes for concepts that are new to a beginner Node.js developer.

## Folder Conventions

See `docs/05-folder-structure.md` for full layout and rationale.

## Dependencies

- Do not add dependencies without justification.
- Prefer well-maintained, small-footprint packages.
- Use pnpm for all package management.

## Git

- Write clear, conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`).
- Keep commits atomic — one logical change per commit.
