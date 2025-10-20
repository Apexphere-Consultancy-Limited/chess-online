# Move Synchronization Architecture

## Overview

The online chess game uses a **dual-channel synchronization strategy** to ensure moves are synced across players in real-time while maintaining data integrity.

### Two Communication Channels

1. **Broadcast Channel** (Supabase Realtime Broadcast)
   - Purpose: Instant board position updates
   - Speed: ~50-100ms latency
   - Payload: Minimal (FEN, from/to squares, player_id)
   - Reliability: Best-effort delivery

2. **Database Channel** (Supabase Postgres Changes)
   - Purpose: Authoritative move history with full metadata
   - Speed: ~200-500ms latency
   - Payload: Complete (SAN notation, captured pieces, move number, etc.)
   - Reliability: Guaranteed delivery with database persistence

---

## Player Makes a Move - Complete Flow

### Step 1: Local Optimistic Update (Player 1)

**Location:** [ChessGame.tsx:549-582](../src/components/ChessGame.tsx#L549-L582)

```typescript
// Player 1 clicks a square to make a move
applyMove(fromRow, fromCol, toRow, toCol)
  ↓
// chess.js validates and makes the move
chess.move({ from, to, promotion })
  ↓
// Update board immediately (optimistic update)
updateBoardPosition(newFen)  // Board renders new position instantly
```

**Result:** Player 1's board updates **immediately** (0ms latency)

---

### Step 2: Send to Server (Player 1)

**Location:** [useSupabaseOpponent.ts:59-88](../src/hooks/useSupabaseOpponent.ts#L59-L88)

```typescript
opponent.sendMove({ from, to, promotion, fen })
  ↓
// Call backend API for validation
makeMove(gameId, from, to, promotion)
  ↓
// Server validates move
// Server inserts to 'moves' table in database
// Server returns response with move metadata
```

**What happens on server:**
1. Validates move is legal
2. Checks it's the correct player's turn
3. Inserts move record to database with full metadata:
   - `from_square`, `to_square`
   - `piece`, `captured_piece`, `promotion`
   - `san_notation` (e.g., "Nf3", "Qxd5")
   - `fen_after` (complete board position)
   - `move_number`

---

### Step 3: Broadcast to Opponent (Player 1)

**Location:** [useSupabaseOpponent.ts:70-88](../src/hooks/useSupabaseOpponent.ts#L70-L88)

```typescript
// After server validates, broadcast via Supabase Realtime
channel.send({
  type: 'broadcast',
  event: 'move',
  payload: {
    from_square,
    to_square,
    promotion,
    fen_after,  // Complete board position
    player_id
  }
})
```

**Speed:** ~50-100ms to reach Player 2

---

### Step 4: Player 2 Receives Broadcast

**Location:** [useGameRealtime.ts:42-58](../src/hooks/useGameRealtime.ts#L42-L58)

```typescript
// Supabase Realtime fires broadcast event
channel.on('broadcast', { event: 'move' }, (payload) => {
  onMove({
    ...payload,
    source: 'broadcast'  // Tag as broadcast
  })
})
```

**Then:** [ChessGame.tsx:495-500](../src/components/ChessGame.tsx#L495-L500)

```typescript
if (move.source === 'broadcast') {
  updateBoardPosition(move.fen)  // Update board instantly
}
```

**Result:** Player 2's board updates **within ~100ms**

---

### Step 5: Database INSERT Event Fires

**Location:** [useGameRealtime.ts:26-41](../src/hooks/useGameRealtime.ts#L26-L41)

When the server inserts the move into the database, Supabase fires a `postgres_changes` event to **ALL subscribed clients** (both Player 1 and Player 2).

```typescript
channel.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'moves',
  filter: `game_id=eq.${gameId}`
}, (payload) => {
  onMove({
    ...payload.new,  // Full move metadata from database
    source: 'database'  // Tag as database
  })
})
```

**Received by:** Both Player 1 AND Player 2

---

### Step 6: Both Players Update Move History

**Location:** [ChessGame.tsx:474-489](../src/components/ChessGame.tsx#L474-L489)

```typescript
if (move.source === 'database' && move.san_notation) {
  // Append to move history with full metadata
  appendMoveToHistory({
    from_square: move.from_square,
    to_square: move.to_square,
    san_notation: move.san_notation,  // "Nf3", "Qxd5", etc.
    piece: move.piece,
    captured_piece: move.captured_piece,
    promotion: move.promotion,
    move_number: move.move_number
  })

  // Only update board for opponent (Player 1's board already updated)
  if (!isOwnMove) {
    updateBoardPosition(move.fen)  // Fallback if broadcast was missed
  }
}
```

**Player 1:** Receives own database INSERT → appends to history (board already updated in Step 1)
**Player 2:** Receives database INSERT → appends to history (board already updated in Step 4)

**Result:** Both players' move history displays the move with full metadata

---

## Timing Diagram

```
Time →

Player 1 Makes Move:
├─ 0ms    │ Player 1: Board updates (optimistic)
├─ 50ms   │ Server receives, validates, stores in DB
├─ 100ms  │ Player 2: Receives broadcast → Board updates ✓
├─ 300ms  │ Both: Receive database INSERT → History updates ✓
```

---

## Why Dual Channels?

### Broadcast Channel Benefits
- **Speed:** Near-instant board updates for responsive gameplay
- **Lightweight:** Minimal payload size
- **User Experience:** Opponent sees moves immediately

### Database Channel Benefits
- **Reliability:** Guaranteed delivery (database persistence)
- **Metadata:** Complete move information for history display
- **Authoritative:** Single source of truth for game state
- **Crash Recovery:** Can reload game state from database

### Combined Benefits
- Board updates instantly via broadcast
- History populates reliably via database
- If broadcast fails, database provides fallback
- If database is slow, broadcast provides instant feedback

---

## Code Components

### 1. useGameRealtime Hook
**File:** [src/hooks/useGameRealtime.ts](../src/hooks/useGameRealtime.ts)

**Purpose:** Manages Supabase Realtime subscriptions for both channels

**Key Configuration:**
```typescript
broadcast: { self: true }  // Receive own broadcasts (filtered later)
```

**Subscriptions:**
- `postgres_changes` for database INSERTs
- `broadcast` for real-time move events

---

### 2. useSupabaseOpponent Hook
**File:** [src/hooks/useSupabaseOpponent.ts](../src/hooks/useSupabaseOpponent.ts)

**Purpose:** Wraps realtime subscriptions and provides opponent interface

**Key Functions:**
- `sendMove()` - Sends move to server and broadcasts to opponent
- `onOpponentMove()` - Registers callback for incoming moves
- `handleRealtimeMove()` - Filters own broadcasts (line 26-28)

**Filtering Logic:**
```typescript
// Ignore own broadcasts (board already updated locally)
if (payload.source === 'broadcast' && user && payload.player_id === user.id) {
  return
}
```

---

### 3. ChessGame Component
**File:** [src/components/ChessGame.tsx](../src/components/ChessGame.tsx)

**Purpose:** Main game logic and UI

**Key Functions:**

#### `updateBoardPosition(fen)` - Lines 239-266
- Updates ONLY visual board position
- NO side effects on move history
- Used by: Broadcasts, database fallback, optimistic updates

#### `appendMoveToHistory(moveData)` - Lines 273-318
- Updates ONLY move history
- NO side effects on board position
- Includes deduplication logic
- Used by: Database INSERTs, initial game load

#### `updateBoardAndHistory()` - Lines 320-357
- Updates BOTH board and history from chess.js
- ONLY for offline games
- Used by: Offline opponents, undo/reset

#### Move Handler - Lines 461-544
- Subscribes to opponent moves (runs once on mount)
- Routes to appropriate update function based on source
- Handles both online and offline games

---

## Update Strategy by Game Mode

### Online Games

**Player's Own Move:**
```
applyMove()
  → chess.move()
  → updateBoardPosition() ← Board updates instantly
  → opponent.sendMove()
  → (broadcast sent, own broadcast filtered out)
  → (database INSERT event received)
  → appendMoveToHistory() ← History updates
```

**Opponent's Move:**
```
(broadcast received)
  → updateBoardPosition() ← Board updates instantly

(database INSERT received)
  → appendMoveToHistory() ← History updates
  → updateBoardPosition() ← Redundant but safe fallback
```

### Offline Games

**Any Move:**
```
chess.move()
  → updateBoardAndHistory()
    ├─ Updates board from chess.board()
    └─ Rebuilds history from chess.history()
```

Single source of truth: chess.js instance

---

## Initial Game Load

**File:** [ChessGame.tsx:367-433](../src/components/ChessGame.tsx#L367-L433)

When a player joins an in-progress game:

```typescript
// Fetch all moves from database
const { data: moves } = await supabase
  .from('moves')
  .select('*')
  .eq('game_id', gameId)
  .order('move_number', { ascending: true })

// Get final position from last move
const finalFen = moves[moves.length - 1].fen_after

// Update board to final position (no need to replay)
updateBoardPosition(finalFen)

// Build history from database moves
moves.forEach(move => {
  appendMoveToHistory(move)
})
```

**Benefits:**
- Fast loading (just load final FEN, not replay all moves)
- Board and history built independently from database
- No coupling between board and history updates

---

## Deduplication Strategy

**Location:** [ChessGame.tsx:302-317](../src/components/ChessGame.tsx#L302-L317)

Because React StrictMode in development causes components to mount/unmount/remount, multiple subscriptions can fire for the same database INSERT. The `appendMoveToHistory` function includes deduplication:

```typescript
setMoveHistory(prev => {
  // Check if identical move already exists
  const isDuplicate = prev.some(existingMove =>
    existingMove.notation === formattedMove.notation &&
    existingMove.from.row === formattedMove.from.row &&
    existingMove.from.col === formattedMove.from.col &&
    existingMove.to.row === formattedMove.to.row &&
    existingMove.to.col === formattedMove.to.col
  )

  if (isDuplicate) {
    return prev  // Skip duplicate
  }

  return [...prev, formattedMove]  // Add unique move
})
```

This makes the function **idempotent** - safe to call multiple times with the same move.

---

## Error Handling & Fallbacks

### Broadcast Fails or Delayed
- Database INSERT provides fallback board update
- Move still appears correctly, just slightly slower

### Database INSERT Fails
- Move already in chess.js instance (validated)
- Board position correct via broadcast
- History might be missing metadata (rare edge case)

### Both Fail
- Local chess.js instance has the move
- Can recover by reloading game from database
- Server has authoritative record

---

## Performance Characteristics

### Latencies (Typical)

| Event | Latency | Purpose |
|-------|---------|---------|
| Player 1 local board update | 0ms | Immediate feedback |
| Player 2 broadcast reception | 50-100ms | Real-time board sync |
| Database INSERT event | 200-500ms | Reliable history update |
| Initial page load | 300-600ms | Fetch game + moves |

### Network Efficiency

**Per Move Sent:**
- 1x HTTP request to server (~500 bytes)
- 1x Database INSERT (server-side)
- 1x Broadcast message (~200 bytes)
- 2x Database INSERT events (Supabase → both players, ~1KB each)

**Total Bandwidth:** ~2KB per move (very efficient)

---

## Data Flow Diagram

```
┌─────────────┐                           ┌─────────────┐
│  Player 1   │                           │  Player 2   │
│   (White)   │                           │   (Black)   │
└──────┬──────┘                           └──────┬──────┘
       │                                         │
       │ 1. Makes move (e4)                      │
       │ ├─ Local board updates (0ms)            │
       │ └─ sendMove() to server                 │
       │         │                                │
       ▼         ▼                                │
   ┌────────────────────┐                        │
   │   Backend Server   │                        │
   │  ┌──────────────┐  │                        │
   │  │   Validate   │  │                        │
   │  │  chess.move()│  │                        │
   │  └──────┬───────┘  │                        │
   │         │           │                        │
   │  ┌──────▼───────┐  │                        │
   │  │   Database   │  │                        │
   │  │INSERT 'moves'│  │                        │
   │  └──────┬───────┘  │                        │
   └─────────┼──────────┘                        │
             │                                    │
   ┌─────────┴──────────────────────┐            │
   │    Supabase Realtime            │            │
   │                                 │            │
   │  ┌─────────────────────┐        │            │
   │  │  Broadcast Channel  │────────┼────────────┼──> 2. Broadcast (50-100ms)
   │  │   (fen_after)       │        │            │    ├─ Player 2 board updates
   │  └─────────────────────┘        │            │    └─ Player 1 filters out own
   │                                 │            │
   │  ┌─────────────────────┐        │            │
   │  │ Database Changes    │────────┼────────────┼──> 3. DB INSERT (200-500ms)
   │  │ (full metadata)     │────────┼────────────┘    ├─ Player 1 history updates
   │  └─────────────────────┘        │                 └─ Player 2 history updates
   │                                 │
   └─────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Why Not Broadcast-Only?
- **Problem:** Broadcasts are not guaranteed delivery
- **Problem:** Broadcasts don't persist (no crash recovery)
- **Problem:** Broadcasts lack full metadata

### 2. Why Not Database-Only?
- **Problem:** 200-500ms latency feels sluggish
- **Problem:** Poor user experience for real-time gameplay

### 3. Why Both Players Receive Database INSERTs?
- **Benefit:** Both players get same authoritative data
- **Benefit:** Guaranteed consistency
- **Benefit:** Simpler logic (no special-casing who gets what)

### 4. Why Filter Own Broadcasts?
- **Reason:** Player's board already updated optimistically
- **Reason:** Avoid redundant state updates
- **Reason:** Prevent race conditions

### 5. Why Deduplication in appendMoveToHistory?
- **Reason:** React StrictMode causes multiple subscriptions in dev
- **Reason:** Makes function idempotent (safe to call multiple times)
- **Reason:** Robust against any subscription lifecycle issues

---

## Testing Scenarios

### Happy Path
1. Player 1 makes move → Board updates instantly
2. Player 2 sees move within 100ms
3. Both see move in history within 500ms
4. Move persisted in database

### Slow Database
1. Player 1 makes move → Board updates instantly
2. Player 2 sees move via broadcast (100ms)
3. History appears 2 seconds later (slow INSERT)
4. Everything still consistent

### Missed Broadcast
1. Player 1 makes move → Board updates instantly
2. Player 2 misses broadcast
3. Player 2 gets database INSERT (500ms)
4. Player 2 board updates via database fallback
5. History appears correctly

### Page Refresh Mid-Game
1. Player loads game
2. Fetches all moves from database
3. Loads final FEN → board shows current position
4. Loops through moves → history populates
5. Subscribes to realtime → ready for new moves

---

## Future Improvements

### Potential Optimizations
1. **WebSockets for Broadcast:** Lower latency than Supabase Realtime
2. **Optimistic History Updates:** Show move in history immediately, confirm with database later
3. **Move Compression:** Send only move notation instead of full FEN
4. **Connection Quality Detection:** Fall back to database-only on poor network

### Potential Features
1. **Move Confirmation:** Visual indicator when opponent has confirmed receiving move
2. **Reconnection Handling:** Auto-resume on connection loss
3. **Offline Queue:** Store moves locally, sync when connection restored
4. **Undo Request:** Request opponent to agree to undo last move

---

## Related Documentation

- [Move History Refactor Design](./MOVE_HISTORY_REFACTOR_DESIGN.md) - Architecture decisions for decoupling
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - What was changed and why

---

## Conclusion

The dual-channel synchronization strategy provides:
- ✅ **Fast** board updates via broadcasts (~100ms)
- ✅ **Reliable** history updates via database (~500ms)
- ✅ **Consistent** state across all players
- ✅ **Recoverable** from failures (database is source of truth)
- ✅ **Scalable** architecture for future features

This architecture strikes the optimal balance between real-time responsiveness and data reliability for online chess gameplay.
