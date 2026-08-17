# Product Requirements Document: Chatter

## Target Persona
- **Primary**: Developer learning real-time web development and modern frontend patterns.
- **Secondary**: Friends and family who will be invited to test the app and interact in the chat.

## Functional Capabilities
1. **Real-time messaging**: Send and receive messages instantly across all connected clients.
2. **Username identity**: Clean modal overlay prompt on first visit. Username is stored in memory for the duration of the session.
3. **Typing indicators**: A "User is typing..." message shown to all other users in real-time.
4. **Presence system**: Online/offline status with green dot indicators, accompanied by user join/leave system notifications in the chat feed.
5. **Message timestamps**: Relative or absolute time shown for each message.
6. **Emoji support**: Basic emoji input and rendering in messages.
7. **Auto-scroll**: Chat feed automatically scrolls to the latest message. Includes smart scroll detection (doesn't force scroll to bottom if the user has scrolled up to read history).
8. **Theme switching**: Dark/light toggle with system preference detection (`prefers-color-scheme`). Preference is persisted to `localStorage`. The Teal/Cyan accent color adapts appropriately to the active theme.
9. **Responsive layout**: Sidebar (online users) + main chat area on desktop. On mobile, the sidebar is hidden behind a hamburger menu.
10. **Online users list**: Sidebar showing all currently connected users with their status dots.

## User Flows
1. **First visit**: User visits the app → Modal asks for username → User enters name → Joins the chat room.
2. **Messaging**: User types a message → Hits Enter or clicks Send → Message appears for all users instantly.
3. **Typing Feedback**: User starts typing → Other users see a typing indicator → Indicator disappears when they stop or send the message.
4. **Joining**: A new user joins → A system message ("X joined the chat") appears in the feed → The online list updates for everyone.
5. **Leaving**: A user disconnects → A system message ("X left the chat") appears in the feed → The online list updates for everyone.
6. **Theming**: User clicks the theme toggle → Theme switches immediately → The new preference is saved to `localStorage`.

## Error Behavior Contracts
- **Connection lost**: Show a reconnecting indicator. Socket.IO will handle automatic reconnection attempts.
- **Empty message**: Prevent sending. The send button should be disabled, and pressing Enter should do nothing.
- **Empty username**: Prevent joining. The submit button on the initial modal should be disabled.
- **Username too long**: Truncate or limit input using HTML `maxlength` attributes.

## Out of Scope
- No authentication or secure login system.
- No private or direct messages.
- No multiple chat rooms or channels.
- No file, document, or image sharing.
- No message editing or deletion capabilities.
- No end-to-end encryption.
- No browser push notifications.
- No video or voice chat.
- No message persistence across page refreshes (messages are lost on reload until the PostgreSQL database phase).
- No admin moderation tools or user banning.
- No message search functionality.
