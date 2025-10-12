# Unified Chess Game Architecture - Migration Plan

## Executive Summary

**Goal**: Migrate to a unified architecture where both online and offline games use the same core components, with the online game's realtime approach as the foundation.

**Strategy**: Phased migration with the local game kept as reference until all features are migrated.

**Timeline**: 4 phases, incrementally building features while maintaining stability.

---

## Current Architecture Analysis

### Online Game (Target Architecture)
**File**: `src/components/OnlineGame.tsx`

**Purpose**: Human vs Human over the network

#### ✅ What It Has:
- **Realtime sync** via Supabase channels
- **Optimistic updates** for responsive UX
- **Server validation** with rollback on rejection
- **Better piece selection UX** (click to deselect, switch pieces)
- **chess.js library** for rules (industry standard)
- **Timer management** with timeout handling
- **Forfeit functionality**

#### ❌ Needs to Add:
- ❌ Drag and drop pieces
- ❌ Promotion modal (currently hardcoded to queen)
- ❌ Checkmate sound (currently plays check sound)
- ❌ Better stalemate handling

#### 🚫 Intentionally Excluded (by design):
- 🚫 Undo moves - Can't undo opponent's moves
- 🚫 Hints - Unfair competitive advantage
- 🚫 Game reset - Games persist in database
- 🚫 Game mode selection - Mode is "online multiplayer"
- 🚫 Bot/AI opponent - Uses human opponents

---

### Offline Game (Reference Implementation)
**Files**: `src/hooks/useMoveRules.ts`, `src/hooks/useGameBoard.ts`, `src/hooks/useComputerAI.ts`

**Purpose**: Human vs Bot or Human vs Human (local)

#### ✅ What It Has:
- **Drag and drop** fully implemented
- **Undo moves** with full game state reconstruction
- **Hints system** (unlimited, shows best moves)
- **Game reset** with mode selection
- **Promotion modal** (choose piece type)
- **Bot AI** with difficulty levels (easy/medium/hard)
- **Game mode** (vs Friend, vs Bot)
- **Complete game state management** (en passant, castling, etc.)
- **Checkmate sound** properly plays

#### ❌ Needs to Add:
- ❌ Better piece selection UX (from online game)

#### 🚫 Intentionally Excluded (by design):
- 🚫 Network/online features - Local only
- 🚫 Forfeit - Can just reset the game

---

## Feature Comparison Matrix

| Feature | Online | Offline | Priority | Notes |
|---------|--------|---------|----------|-------|
| Click to move | ✅ Advanced | ✅ Basic | - | Online has better UX |
| Drag and drop | ❌ | ✅ | **P0** | Needed for offline |
| Valid move highlights | ✅ | ✅ | - | Both have |
| Undo moves | N/A | ✅ | **P1** | **Offline only** - Can't undo opponent |
| Hints | N/A | ✅ | **P1** | **Offline only** - Would be unfair online |
| Game reset | ❌ | ✅ | **P2** | Needed for offline |
| Promotion modal | ❌ | ✅ | **P0** | Both need this |
| Sound effects | ✅ | ✅ | ✅ Done | Unified |
| Move history | ✅ | ✅ | ✅ Done | Both have |
| Captured pieces | ✅ | ✅ | ✅ Done | Both have |
| Timers | ✅ | ✅ | ✅ Done | Both have |
| Bot AI | N/A | ✅ | **P0** | **Offline only** - Local opponent |
| Online multiplayer | ✅ | N/A | ✅ Done | **Online only** - Network opponent |
| Forfeit | ✅ | N/A | ✅ Done | **Online only** - Can just reset offline |
| Checkmate sound | ⚠️ Partial | ✅ | **P2** | Polish |
| Stalemate detection | ⚠️ Partial | ✅ | **P2** | Polish |

**Legend:**
- ✅ = Feature exists
- ❌ = Feature missing (needs to be added)
- **N/A** = Feature not applicable to this mode (by design)
- ⚠️ = Feature partially implemented

---

## Phased Migration Plan

### Phase 0: Foundation (Current State)
**Status**: ✅ Completed
- [x] Sound effects unified via `useChessSounds` hook
- [x] Both games working independently
- [x] Online game has better piece selection UX

---

### Phase 1: Create Abstraction Layer
**Goal**: Build the opponent abstraction without breaking existing code

**Duration**: 2-3 hours

#### Tasks:

1. **Create `types/gameOpponent.ts`**
   ```typescript
   interface GameOpponent {
     sendMove: (move: ChessMove) => Promise<void>
     onOpponentMove: (callback: (move: ChessMove) => void) => () => void
     onGameEnd: (callback: (result: GameResult) => void) => () => void
     disconnect: () => void
     isOnline: boolean
   }
   ```

2. **Create `hooks/useSupabaseOpponent.ts`**
   - Wrap existing realtime channel logic
   - Implement `GameOpponent` interface
   - Handle move broadcasting
   - Handle game state sync

3. **Create `hooks/useLocalOpponent.ts`**
   - Implement `GameOpponent` interface
   - For "vs Friend": Just echo back (no AI)
   - For "vs Bot": Integrate existing AI from `useComputerAI`
   - Add configurable delay to mimic network latency (200-500ms)

4. **Test both implementations** side-by-side with existing code

**Deliverables**:
- ✅ `GameOpponent` interface defined
- ✅ `useSupabaseOpponent` working with existing online game
- ✅ `useLocalOpponent` working with AI
- ✅ No regressions in existing functionality

---

### Phase 2: Unified Game Component (Core Features)
**Goal**: Create new unified game component with essential features

**Duration**: 3-4 hours

#### Tasks:

1. **Create `components/UnifiedChessGame.tsx`**
   - Single game component that works for both online and offline
   - Uses `GameOpponent` interface
   - Implements core chess gameplay

2. **Migrate Core Features First**:
   - ✅ Board rendering
   - ✅ Click to move (advanced UX from online)
   - ✅ Valid move highlights
   - ✅ Sound effects (already unified)
   - ✅ Move history
   - ✅ Captured pieces
   - ✅ Timers

3. **Add P0 Features** (blocking for feature parity):
   - **Drag and drop** from offline game
   - **Promotion modal** from offline game
   - **Bot AI opponent** via `useLocalOpponent`

4. **Create `pages/UnifiedGame.tsx`**
   - Router logic to determine opponent type
   - Pass appropriate `GameOpponent` implementation

5. **Test with both opponent types**:
   - Online multiplayer works
   - Local vs Bot works
   - Local vs Friend works

**Deliverables**:
- ✅ `UnifiedChessGame` component working
- ✅ Drag and drop functional
- ✅ Promotion modal working
- ✅ Bot AI integrated
- ✅ All P0 features complete

---

### Phase 3: Advanced Features (P1)
**Goal**: Add quality-of-life features

**Duration**: 2-3 hours

#### Tasks:

1. **Undo System**
   - Works for offline games only (can't undo opponent's moves)
   - Disable in online games or implement "takeback request" flow
   - Reuse logic from `useMoveRules.handleUndo`

2. **Hints System**
   - Works for offline games only
   - Show best move suggestions
   - Reuse logic from `useMoveRules.handleHint`
   - Uses `getBestMoves` from chess utilities

3. **Game Mode Selection**
   - Modal at game start for offline games
   - Choose: vs Friend, vs Easy Bot, vs Medium Bot, vs Hard Bot

4. **Improved Sound Logic**
   - Add checkmate sound properly
   - Ensure consistent timing between online/offline

**Deliverables**:
- ✅ Undo working for offline games
- ✅ Hints system functional
- ✅ Game mode selection working
- ✅ Sound effects consistent

---

### Phase 4: Polish & Cleanup (P2)
**Goal**: Remove old code, add final touches

**Duration**: 1-2 hours

#### Tasks:

1. **Migration Complete**:
   - Route all games through `UnifiedChessGame`
   - Remove old `OnlineGame.tsx` component
   - Remove old `useMoveRules.ts` hook
   - Keep utility functions in `utils/chess.ts`

2. **Game Reset**
   - Allow resetting/starting new game
   - Keep game mode selection modal

3. **Final Features**:
   - Stalemate detection and modal
   - Draw by repetition detection
   - Insufficient material detection

4. **Testing**:
   - Test all game modes thoroughly
   - Test online multiplayer end-to-end
   - Test bot AI at all difficulty levels
   - Test edge cases (checkmate, stalemate, promotion, castling, en passant)

5. **Documentation**:
   - Update README with new architecture
   - Document the `GameOpponent` interface
   - Add comments to key functions

**Deliverables**:
- ✅ Old code removed
- ✅ All features working
- ✅ Comprehensive testing complete
- ✅ Documentation updated

---

## Key Design Decisions

### 1. Why Keep chess.js for Online Games?
- Industry-standard library
- Server-side validation already uses it
- More reliable than custom implementation
- Online games need server trust anyway

### 2. Why Add Artificial Latency to Local Games?
- Consistent UX between online and offline
- Prevents jarring instant bot moves
- Makes animations and sounds feel natural
- Configurable (can be disabled for debugging)

### 3. Why Are Undo/Hints/Bot AI Offline-Only?

**These features are NOT applicable to online games by design:**

**Undo:**
- You can't undo your opponent's moves
- Online games are competitive - no take-backs
- Could add "takeback request" feature later (mutual agreement)
- Offline games allow undo because you control both sides

**Hints:**
- Would be unfair advantage in competitive online play
- Like having a coach whispering moves during a tournament
- Offline games allow hints for learning/practice

**Bot AI:**
- Online games have human opponents via network
- Bot AI is the "opponent" for offline games
- Two completely different opponent types (network vs local)
- This is the core reason for the `GameOpponent` abstraction!

### 4. How to Handle Different Timer Behaviors?
- Online: Server-synced timers (authoritative)
- Offline: Local timers (no sync needed)
- Both use same `Timer` component
- Opponent interface abstracts the difference

### 5. Do We Need Backend/Service Changes?

**NO! This is a frontend-only refactoring.**

**What stays the same:**
- ✅ Database schema (games, moves, profiles tables)
- ✅ `validate-move` edge function
- ✅ Supabase Realtime channels
- ✅ Authentication & RLS policies
- ✅ All API contracts

**Why no backend changes needed:**
- The `GameOpponent` interface is a **thin wrapper** around existing Supabase calls
- `useSupabaseOpponent` internally calls the same `makeMove()` and `useGameRealtime()` functions
- Backend sees **identical API requests** as before
- Local games don't use backend anyway (bot AI runs in browser)

**Example:**
```typescript
// Before (OnlineGame.tsx)
await makeMove(gameId, from, to, 'q')

// After (UnifiedChessGame.tsx)
await opponent.sendMove({ from, to, promotion: 'q' })
  // Which internally still calls:
  // await makeMove(gameId, from, to, 'q')
```

The refactoring reorganizes **how the UI is structured**, not **what it sends to the server**.

---

## Risk Mitigation

### Risk 1: Breaking Existing Online Games
**Mitigation**:
- Phase 1 doesn't touch existing code
- Phase 2 creates new components in parallel
- Keep old code until Phase 4
- Extensive testing at each phase

### Risk 2: Bot AI Performance Issues
**Mitigation**:
- AI already works in offline game
- Just wrap it with `GameOpponent` interface
- Add artificial delay to prevent blocking UI
- Use Web Workers if needed (future optimization)

### Risk 3: Realtime Sync Complexity
**Mitigation**:
- Keep existing Supabase integration
- `useSupabaseOpponent` is thin wrapper
- Opponent interface isolates complexity
- Fallback to existing code if issues

### Risk 4: Feature Parity Gaps
**Mitigation**:
- Comprehensive feature matrix (above)
- Prioritized P0/P1/P2 features
- Test checklist for each phase
- Keep old code as reference

---

## Success Criteria

### Phase 1 Complete:
- [ ] Opponent abstractions working
- [ ] No regressions in existing games
- [ ] Both opponent types tested

### Phase 2 Complete:
- [ ] Unified component working
- [ ] All P0 features functional
- [ ] Online multiplayer works
- [ ] Bot AI works

### Phase 3 Complete:
- [ ] Undo/hints working for offline
- [ ] Game mode selection working
- [ ] Sound effects polished

### Phase 4 Complete:
- [ ] Old code removed
- [ ] All features working
- [ ] Testing complete
- [ ] Documentation updated

### Overall Success:
- [ ] Single codebase for all game modes
- [ ] No feature regressions
- [ ] Improved maintainability
- [ ] Consistent UX across modes
- [ ] Easier to add new features

---

## File Structure After Migration

```
src/
├── components/
│   ├── UnifiedChessGame.tsx          # Main game component (replaces OnlineGame)
│   ├── ChessBoard.tsx                # Existing (no changes)
│   ├── MoveHistory.tsx               # Existing (no changes)
│   ├── CapturedPieces.tsx            # Existing (no changes)
│   ├── Timer.tsx                     # Existing (no changes)
│   ├── PromotionModal.tsx            # Existing (enhanced)
│   ├── GameModeModal.tsx             # Existing (enhanced)
│   └── ...
├── hooks/
│   ├── useChessSounds.ts             # ✅ Already unified
│   ├── useGameOpponent.ts            # New: Main hook
│   ├── useSupabaseOpponent.ts        # New: Online implementation
│   ├── useLocalOpponent.ts           # New: Offline implementation
│   ├── useComputerAI.ts              # Existing (wrapped)
│   └── useGameBoard.ts               # May be deprecated
├── pages/
│   ├── UnifiedGame.tsx               # New: Router for all games
│   ├── Game.tsx                      # Removed/refactored
│   └── ...
├── types/
│   ├── gameOpponent.ts               # New: Interface definitions
│   ├── chess.ts                      # Existing (no changes)
│   └── ...
└── utils/
    ├── chess.ts                      # Existing (keep utilities)
    ├── soundEffects.ts               # Existing (no changes)
    └── ...
```

---

## Next Steps

1. **Review this plan** - Discuss any concerns or suggestions
2. **Start Phase 1** - Create opponent abstractions
3. **Incremental commits** - Small, testable changes
4. **Continuous testing** - Verify no regressions
5. **Documentation** - Update as we go

**Estimated Total Time**: 8-12 hours of focused development

**Benefits**:
- 50% less code duplication
- Easier to add new features
- Consistent UX
- Better testability
- Future-proof architecture
