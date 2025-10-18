# UnifiedChessGame - Feature Checklist

## Source: Local Game (`src/pages/Game.tsx` + `src/hooks/useMoveRules.ts`)

The local game is MORE complete than the online game. We'll use it as the primary reference.

---

## Core Game Features (ALL modes)

### Board & Pieces
- [ ] Chess board rendering (`ChessBoard` component)
- [ ] Piece click to select
- [ ] Click destination to move
- [ ] Valid move highlights (green circles)
- [ ] Selected piece highlight
- [ ] **Drag and drop pieces** ⭐ (local has, online missing)
- [ ] Last move highlight (from/to squares) ⭐ (local has, online missing)
- [ ] Board coordinates (a-h, 1-8)

### Move Logic
- [ ] chess.js for rules validation
- [ ] Castling
- [ ] En passant
- [ ] **Promotion modal** ⭐ (local has choice, online hardcoded queen)
- [ ] Checkmate detection
- [ ] Stalemate detection
- [ ] Check indication

### Game State
- [ ] Move history display (`MoveHistory` component)
- [ ] Captured pieces display (`CapturedPieces` component)
- [ ] Score calculation (material advantage)
- [ ] Current player turn
- [ ] Timers (`Timer` component)

### Audio
- [ ] Move sound
- [ ] Capture sound
- [ ] Check sound
- [ ] Checkmate sound

### Modals
- [ ] **Game mode selection modal** ⭐ (local only - friend/easy/medium/hard)
- [ ] **Promotion modal** (choose piece) ⭐
- [ ] **Game over modal** (winner, reason, restart) ⭐
- [ ] Confirmation modal (for forfeit)

---

## Offline-Only Features

### Game Controls (`GameControls` component)
- [ ] **Undo button** (can undo moves)
- [ ] **Hint button** (shows best move)
- [ ] **Reset button** (start new game)

### Bot Features
- [ ] **Bot AI integration** (easy/medium/hard)
- [ ] **Bot chat** (`BotChat` component - personality!)
- [ ] Bot thinking indicator
- [ ] Artificial delay for natural feel

### Hint System
- [ ] Calculate best moves
- [ ] Highlight hint squares on board
- [ ] Unlimited hints (for learning)

---

## Online-Only Features

### Network Communication
- [ ] Use `opponent.sendMove()` to send moves
- [ ] Use `opponent.onOpponentMove()` to receive moves
- [ ] Handle network errors
- [ ] Optimistic updates with rollback

### Online-Specific UI
- [ ] **Forfeit button** (online only)
- [ ] Player color assignment (white/black)
- [ ] Waiting for opponent indicator
- [ ] Connection status

### Online-Specific Logic
- [ ] Server-side move validation
- [ ] Game persistence (Supabase)
- [ ] Timer sync (authoritative server time)
- [ ] Game completion handling

---

## Conditional Features (Based on `opponent.isOnline`)

```typescript
if (opponent.isOnline) {
  // Show: Forfeit button
  // Hide: Undo, Hints, Reset, Bot Chat
  // Enable: Network error handling
} else {
  // Show: Undo, Hints, Reset, Bot Chat, Game Controls
  // Hide: Forfeit button
  // Enable: Local game controls
}
```

---

## Component Structure

```
UnifiedChessGame
├── Props
│   ├── opponent: GameOpponent (online/bot/friend)
│   ├── playerColor?: 'white' | 'black' (for online games)
│   └── gameMode?: GameMode (for offline games)
│
├── State (chess.js instance)
│   ├── boardState
│   ├── currentPlayer
│   ├── selectedSquare
│   ├── validMoves
│   ├── draggedPiece
│   ├── lastMove
│   ├── hintSquares
│   ├── moveHistory
│   ├── capturedPieces
│   ├── score
│   ├── promotionData
│   ├── gameOver
│   ├── timers
│   └── inCheck
│
├── Handlers
│   ├── handleSquareClick
│   ├── handleDragStart/Over/Drop/End
│   ├── handlePromotion
│   ├── handleUndo (offline only)
│   ├── handleHint (offline only)
│   ├── handleReset (offline only)
│   ├── handleForfeit (online only)
│   └── handleOpponentMove (from opponent.onOpponentMove)
│
└── UI Components
    ├── ChessBoard
    ├── MoveHistory
    ├── CapturedPieces
    ├── Timer
    ├── PromotionModal
    ├── GameOverModal
    ├── GameModeModal (offline only)
    ├── BotChat (bot mode only)
    ├── GameControls (offline only)
    └── Forfeit button (online only)
```

---

## Implementation Strategy

### Phase 2A: Core Game (P0)
1. Create UnifiedChessGame component shell
2. Add chess.js integration
3. Add board rendering with ChessBoard
4. Add click-to-move
5. Add drag-and-drop
6. Add promotion modal
7. Add sound effects (already unified!)
8. Add move history, captured pieces, timers

### Phase 2B: Opponent Integration (P0)
1. Accept `opponent` prop
2. Call `opponent.sendMove()` after player moves
3. Subscribe to `opponent.onOpponentMove()`
4. Handle opponent moves (validate and apply)

### Phase 2C: Conditional Features (P1)
1. Check `opponent.isOnline` for UI decisions
2. Show/hide controls based on mode
3. Add undo/hints for offline
4. Add forfeit for online
5. Add bot chat for bot mode
6. Add game mode selection for offline

### Phase 2D: Polish (P2)
1. Game over modal
2. Last move highlighting
3. Hint squares
4. Better checkmate/stalemate handling
5. Error handling

---

## Key Decisions

### Use Local Game as Foundation
- It has MORE features
- It has BETTER UX (drag-and-drop, modals, hints)
- Online game is actually the "stripped down" version!

### Keep Online-Specific Logic Minimal
- Only network communication via opponent
- Everything else is shared game logic

### Conditional UI
- Single component, conditional rendering
- `if (opponent.isOnline)` for online-only features
- `if (!opponent.isOnline)` for offline-only features
