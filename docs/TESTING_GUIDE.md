# Online Multiplayer Testing Guide

## ✅ Setup Complete

Your application is ready for testing!

- **Frontend**: http://localhost:5174/
- **Backend**: http://127.0.0.1:54321 (Supabase local)
- **Edge Functions**: ✅ Responding

## How to Test Online Multiplayer

### Step 1: Create Two Users

You need two separate accounts to test multiplayer.

**User 1:**
1. Open http://localhost:5174/login
2. Click "Sign up" (or toggle at bottom)
3. Fill in:
   - Name: `Alice`
   - Email: `alice@test.com`
   - Password: `password123`
   - Skill Level: Any (e.g., "Beginner")
4. Click "Sign up"

**User 2:**
1. Open http://localhost:5174/login in **incognito/private window** (or different browser)
2. Click "Sign up"
3. Fill in:
   - Name: `Bob`
   - Email: `bob@test.com`
   - Password: `password123`
   - Skill Level: Any
4. Click "Sign up"

### Step 2: Create a Game (Alice challenges Bob)

**In Alice's browser:**
1. After signup, you'll be redirected to home page
2. Scroll down to **"Challenge a Player"** section (purple gradient background)
3. Enter opponent username: `Bob`
4. Click "Create Game"
5. You'll be redirected to `/game/{some-uuid}`
6. **Copy this full URL** (e.g., `http://localhost:5174/game/abc-123-def-456`)

You'll see:
- Your color assignment (White or Black - randomly assigned)
- "Current turn: white" or "Current turn: black"
- If it's your turn: "(Your turn!)"

### Step 3: Bob Joins the Game

**In Bob's browser (incognito window):**
1. After signup, you should be at home page
2. **Paste the game URL** that Alice copied into the address bar
3. Press Enter
4. You'll join the same game!

You'll see:
- Your color (opposite of Alice's)
- The same board state
- Turn indicator

### Step 4: Play the Game!

**Taking Turns:**
1. **Alice's Turn** (if she's White):
   - Click on a piece (e.g., pawn at e2)
   - Valid moves will highlight in green
   - Click on a destination square (e.g., e4)
   - Move is sent to server and validated
   - Bob's board updates automatically!

2. **Bob's Turn**:
   - In Bob's window, the turn indicator changes
   - Click and move a piece
   - Alice's board updates in real-time!

3. Continue alternating turns until checkmate or stalemate

**What You Should See:**
- ✅ Moves sync instantly between both browsers
- ✅ Turn indicator updates correctly
- ✅ Invalid moves are rejected
- ✅ Game ends on checkmate/stalemate with result displayed

## Testing Scenarios

### ✅ Scenario 1: Basic Gameplay
- [ ] Alice creates game against Bob
- [ ] Bob joins via URL
- [ ] Both players see correct colors
- [ ] Moves sync in real-time
- [ ] Game completes successfully

### ✅ Scenario 2: Invalid Moves
- [ ] Try to move when it's not your turn → Should be blocked
- [ ] Try to make an illegal chess move → Should be rejected
- [ ] Try to move opponent's pieces → Should be blocked

### ✅ Scenario 3: Game Flow
- [ ] Play a quick game to checkmate
- [ ] Verify game status shows "completed"
- [ ] Verify winner is displayed correctly

### ✅ Scenario 4: Multiple Games
- [ ] Alice creates game against Bob
- [ ] In different tab, Alice creates another game against Bob
- [ ] Both games work independently

## Troubleshooting

### "Failed to create game"

**Error Message:** `Opponent not found`
- **Cause:** Username doesn't exist or spelling is wrong
- **Fix:** Make sure Bob signed up, and username is exactly `Bob` (case-sensitive)

**Error Message:** `Cannot create game against yourself`
- **Cause:** Trying to challenge your own username
- **Fix:** Use the other user's account

### "Not authenticated"

- **Cause:** Session expired or not logged in
- **Fix:** Sign in again at `/login`

### "Game not found"

- **Cause:** Invalid game ID in URL
- **Fix:** Make sure you copied the complete URL from Alice's browser

### Moves Not Syncing

- **Cause:** Realtime not enabled or Edge Function issue
- **Fix:**
  1. Check that backend is running
  2. Check browser console for errors
  3. Verify Edge Functions are deployed

## Debug Mode

Open browser console (F12) to see:
- Move events: `New move received: {...}`
- Edge Function responses
- Any errors

## Expected Console Output

**When Alice makes a move:**
```javascript
// In Alice's console (no realtime event for own move)
// Just sees the move succeed

// In Bob's console:
New move received: {
  from_square: "e2",
  to_square: "e4",
  san_notation: "e4",
  fen_after: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
}
```

## Quick Test Commands

```bash
# Check if backend is running
curl http://127.0.0.1:54321/functions/v1/create-game -X OPTIONS
# Should return: ok

# Check if frontend is running
curl http://localhost:5174
# Should return HTML
```

## Success Criteria

✅ **Integration is working if:**
1. You can create two user accounts
2. Alice can challenge Bob by username
3. Bob can join via the game URL
4. Moves sync between both players in real-time
5. Invalid moves are rejected
6. Game ends correctly on checkmate/stalemate

---

**Current Status:**
- ✅ Frontend running on http://localhost:5174/
- ✅ Backend running on http://127.0.0.1:54321
- ✅ Edge Functions responding
- ⏳ Ready for manual testing

**Next:** Follow Step 1 above to create test users and start playing!
