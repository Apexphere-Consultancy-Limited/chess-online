# Lobby & Notifications Frontend Design (Stage 1)

Design plan for delivering the lobby, challenge, and in-app notification experience in the React/Vite chess client. Pairs with `docs/ARCHITECTURE.md` and `docs/LOBBY_BACKEND_SPEC.md`.

---

## Goals
- Surface segmented lobby presence (Starter/Main/Advanced) with live availability and quick switching.
- Enable direct challenges, responses, and status tracking without copying URLs.
- Expose an in-app notification center that stays synchronized with Supabase Realtime broadcasts.
- Keep the implementation scoped to Stage 1 infrastructure (Supabase Realtime + Edge Functions) while leaving room for Stage 2 upgrades (Redis matchmaking, richer notifications).

---

## Key User Stories
1. **Browse lobby**: As a signed-in player I can see online opponents in my lobby, including their ELO, availability, and quick actions (challenge, invite status).
2. **Switch lobby**: I can switch between Starter/Main/Advanced slices when eligible; the UI indicates my current placement.
3. **Heartbeat/presence**: Remaining on the lobby view automatically keeps my status refreshed; leaving stops broadcasting.
4. **Challenge opponent**: I can send a challenge with an optional message; duplicate or invalid states surface inline errors.
5. **Respond to challenge**: I can review pending invites and accept or decline. Accepting routes into the new game automatically.
6. **Notification center**: Toasts alert me to new invites/updates; a drawer/badge summarizes unread notifications and lets me mark them read.

---

## Information Architecture

| Area | Description |
|------|-------------|
| `/lobby` route | Primary lobby view. Accessible from NavBar; requires auth. |
| Lobby header | Displays placement summary (current lobby, rating range, toggle). Houses action buttons and unread badge. |
| Player list | Scrollable list of available opponents in the current lobby. |
| Challenge inbox | Panel listing incoming/outgoing challenges with status chips and response controls. |
| Notifications drawer | Slide-over (or modal on mobile) showing chronological notification feed; bulk mark as read. |

The lobby route replaces the previous “start game” modal for PvP; existing game mode modal still handles local/AI play.

---

## Visual Layout (Stage 1)

```
┌───────────────────────────────────────────────────────┐
│ NavBar                                                │
├───────────────────────────────────────────────────────┤
│ LobbyHeader                                           │
│  - Current lobby badge & selector                     │
│  - Status indicator (available/in game)               │
│  - Unread notification bell + count                   │
│  - “Leave Lobby” button                               │
├───────────────────────────────────────────────────────┤
│ ┌───────────────┬───────────────────────────────────┐ │
│ │ LobbyTabs     │ LobbyContent                      │ │
│ │ (Starter/...) │ ┌───────────────────────────────┐ │ │
│ │               │ │ PlayerList                   │ │ │
│ │               │ │ - PlayerCard rows            │ │ │
│ │               │ │ - CTA: Challenge / Pending   │ │ │
│ │               │ └───────────────────────────────┘ │ │
│ │               │ ┌───────────────────────────────┐ │ │
│ │               │ │ ChallengePanel               │ │ │
│ │               │ │ - Incoming/outgoing tabs     │ │ │
│ │               │ │ - Accept/Decline/Cancel      │ │ │
│ │               │ └───────────────────────────────┘ │ │
│ └───────────────┴───────────────────────────────────┘ │
├───────────────────────────────────────────────────────┤
│ NotificationDrawer (overlay when opened)              │
└───────────────────────────────────────────────────────┘
```

Mobile: Lobby tabs collapse into a dropdown; player list and challenge panel stack vertically; notification drawer becomes full-screen modal.

---

## Data & API Contracts

| Feature | Source |
|---------|--------|
| Lobby metadata (title, slug, rating range) | Supabase `lobbies` table via REST/RPC hook on initial load. |
| Presence / heartbeat | `POST/PATCH /functions/v1/upsert-lobby-session` every 20s while mounted (or on visibility change). On exit, send an authenticated keepalive `POST` with body `{ intent: "leave" }` so the edge function can remove the session without relying on unsupported DELETE keepalive semantics. |
| Presence updates | Subscribe to Supabase Realtime channel scoped to the active lobby (e.g., `supabase.channel(\`lobby:${lobbyId}\`)` filtering server-side on `lobby_id`). Tear down and resubscribe whenever the lobby changes to avoid cross-lobby noise. |
| Player availability list | Derived from Realtime payloads + fallback fetch of current sessions on mount (`select lobby_sessions` using Supabase JS client). |
| Challenge creation | `POST /functions/v1/create-challenge`. |
| Challenge responses | `POST /functions/v1/respond-to-challenge`. |
| Notifications feed | `notifications` table via Supabase query on mount; subscribe to `notifications:{userId}` Realtime channel for inserts. |
| Mark read | `POST /functions/v1/mark-notification-read`. |

> Retrieve `accessToken` via `supabase.auth.getSession()` (cached in context) to populate the Authorization header for keepalive requests. Update `upsert-lobby-session` to treat `{ intent: "leave" }` POSTs as removal operations so this flow remains compatible with browser keepalive restrictions.

---

## State Management Plan

- **Global context**: extend existing `AuthProvider` consumer components with:
  - `LobbyContext` (new) providing `currentLobby`, `sessions`, `challenges`, `setStatus`, `switchLobby`. Implement as hook `useLobby`.
  - `NotificationContext` managing feed, unread count, `markRead`.
- **React Query or custom hooks**: Stage 1 can use lightweight internal hooks with `useEffect` + `useReducer`. If React Query is added later, structure adaptor functions accordingly.
- **Supabase Realtime**: Wrap channel subscriptions in effect hooks; ensure proper cleanup on unmount or lobby change. Use debounced merges to avoid frequent state churn.
- **Visibility API**: pause heartbeat when tab hidden for >30s; resume on focus.

---

## Component Breakdown

| Component | Responsibility | Key Props/State |
|-----------|----------------|-----------------|
| `LobbyPage` | Orchestrates data loading, heartbeats, and error boundaries. | uses `useLobby`, `useNotifications`. |
| `LobbyHeader` | Displays current lobby, availability toggle, leave button, unread badge. | `currentLobby`, `status`, `onSwitchLobby`, `notificationsCount`. |
| `LobbyTabs` | Switch between available lobbies; respects membership/eligibility. | `lobbies`, `active`, `onSelect`. |
| `PlayerList` | Renders online players with challenge actions and statuses. | `players`, `onChallenge`, `pendingChallenges`. |
| `PlayerCard` | Individual row; shows username, ELO, status chip, challenge CTA. | `player`, `onChallenge`, `state`. |
| `ChallengePanel` | Tabbed incoming/outgoing list, accept/decline/cancel. | `incoming`, `outgoing`, `onRespond`, `onCancel`. |
| `ChallengeCard` | Displays message, timer (until expiration), actions. | `challenge`, `variant`. |
| `NotificationBell` | Icon/button with unread badge; triggers drawer. | `unreadCount`, `onOpen`. |
| `NotificationDrawer` | Slide-over list with mark-read controls. | `notifications`, `onMarkRead`, `onClose`. |
| `NotificationItem` | Render notification message based on type. | `notification`, `onAction`. |
| `ErrorBanner` | Inline error display for API failures (challenge conflict, etc.). | `message`, `onDismiss`. |

All components reside under `src/components/lobby/` to keep the module cohesive.

---

## Interaction Flows

### Enter Lobby
1. `LobbyPage` mounts → fetches lobbies + current session.
2. Calls `upsert-lobby-session` (POST) with `status='available'` + optional slug.
3. Subscribes to Realtime channels (`lobby:${currentLobby.id}`, `notifications:${userId}`).
4. Stores sessions/challenges/notifications in context; renders lists.

### Heartbeat
- Interval (20s) triggers `PATCH upsert-lobby-session`.
- `beforeunload` & route change call a `leaveLobby()` helper that performs a keepalive `POST` to `/functions/v1/upsert-lobby-session` with body `{ intent: 'leave' }` (and Authorization header). If the request fails (e.g., offline), mark the session stale locally and rely on the scheduled cleanup.
- Visibility hidden → pause interval; resume on visible.

### Create Challenge
1. User clicks “Challenge” on `PlayerCard`.
2. `create-challenge` request; optimistic state adds pending entry with `status='sending'`.
3. Success → update to server payload; failure → show inline error.
4. Incoming challenge for opponent arrives via Realtime → appears in `ChallengePanel` + triggers toast.

### Respond to Challenge
1. User clicks Accept/Decline.
2. `respond-to-challenge` call; optimistic disabled state.
3. On accept, response payload contains `game.id` → immediately call `leaveLobby()` (keepalive POST-with-intent) to release presence, then navigate to `/game/{id}`.
4. On decline, update challenge list and remove toast.

### Notifications
1. Realtime insert triggers toast (`useToast` hook). Determine message using type-specific templates.
2. Drawer displays grouped list (today, earlier).
3. Mark read button calls `mark-notification-read`; update local state on success.

---

## Error & Edge Handling
- **Challenge conflicts (409)**: Display chip on player card (“Busy”) for the current session TTL; optionally re-enable after `challenge.expires_at`.
- **Lobby mismatch**: If `create-challenge` returns “different lobby”, automatically refresh session lists. Provide CTA “Switch to {lobby}?”.
- **Heartbeat failures**: exponential backoff with retry; show banner if unable to keep presence.
- **Realtime disconnect**: Detect via channel status → show “Reconnecting…” inline indicator.
- **Expired challenges**: When backend cleanup removes a challenge, Realtime delete event removes it from the list.
- **Notifications**: If mark-read fails, leave UI unchanged and toast error.

---

## Implementation Phases

1. **Foundations**
   - Create `useLobby` hook managing fetch + heartbeat + realtime.
   - Build `LobbyPage` skeleton with placeholder cards.
   - Ensure `upsert-lobby-session` edge function handles `{ intent: 'leave' }` POSTs by deleting the session.
   - Implement `leaveLobby()` helper (keepalive POST `{ intent: 'leave' }` with Supabase access token) and wire to route transitions.

2. **Challenges**
   - Implement `PlayerList` with challenge CTA.
   - Add `ChallengePanel` and integrate create/respond APIs.

3. **Notifications**
   - Implement `useNotifications` hook with Realtime subscription.
   - Add `NotificationBell`, drawer, mark-read flow, and toasts.

4. **Polish**
   - Mobile responsiveness, skeleton states, animations.
   - Inline timers for challenge expiration, presence sorting (status → rating → name).
   - Accessibility (keyboard navigation, aria roles for tabs/drawer).

5. **QA & Telemetry**
   - Add debug panel flag for session state (dev only).
   - Ensure Supabase teardown occurs on logout.

---

## Future Extensions (Stage 2+)
- Integrate matchmaking queue states once Redis is available (display queue position, estimated wait).
- Expand notifications to include tournament updates, push/email surfacing.
- Add spectator invites and lobby chat modules.
- Cache lobby data via React Query and enable offline fallback for notifications.

---

## Checklist
- [ ] `useLobby` hook with heartbeat + Realtime subscription.
- [ ] Lobby UI components created under `src/components/lobby/`.
- [ ] `/lobby` route wired via `react-router-dom`, guarded by `RequireAuth`.
- [ ] Challenge creation/response flows with optimistic states & error handling.
- [ ] Notification context, drawer, toast integration, mark-read actions.
- [ ] Cleanup on unmount/logout to avoid stale presence or notifications.
- [ ] Mobile layout verified (≤ 768px).
- [ ] Storybook/Chromatic entries optional for critical components (stretch).

---

This design keeps the Stage 1 implementation self-contained while aligning with the evolving architecture and backend APIs. It highlights reusable hooks and components that can later support matchmaking, richer notification channels, and Stage 3 WebSocket integrations.
