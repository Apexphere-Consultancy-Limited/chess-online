# How to Start an Online Multiplayer Game

## Quick Start (3 Steps)

### 1. Deploy Edge Functions

You need to create and deploy the Supabase Edge Functions first:

```bash
# Create the functions directory structure
mkdir -p supabase/functions/validate-move
mkdir -p supabase/functions/create-game

# The function code is in the MVP_IMPLEMENTATION_SPEC.md
# Copy the TypeScript code from lines 265-526 for validate-move
# Copy the TypeScript code from lines 555-651 for create-game
```

**Option A: Quick Setup (Copy from spec)**

I'll create these files for you in the next step.

**Option B: Manual Setup**

1. Install Supabase CLI (if not already):
   ```bash
   npm install -g supabase
   ```

2. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Deploy functions:
   ```bash
   supabase functions deploy validate-move
   supabase functions deploy create-game
   ```

### 2. Create User Accounts

You need at least 2 users to play online:

1. Go to `http://localhost:5173/login` (or your dev URL)
2. Click "Sign up"
3. Create first account:
   - Name: `Player 1`
   - Email: `player1@test.com`
   - Password: `password123`
   - Skill Level: any
4. Sign out
5. Create second account:
   - Name: `Player 2`
   - Email: `player2@test.com`
   - Password: `password123`
   - Skill Level: any

**Important:** The username is what you'll use to challenge opponents. By default, it's the "Name" field from signup.

### 3. Challenge an Opponent

**Player 1's Steps:**
1. Sign in as `player1@test.com`
2. Go to home page (`/`)
3. Scroll to "Challenge a Player" section (appears when logged in)
4. Enter opponent's username: `Player 2`
5. Click "Create Game"
6. You'll be redirected to `/game/{gameId}`
7. **Share this URL** with Player 2

**Player 2's Steps:**
1. Open the same URL in a different browser/incognito window
2. Sign in as `player2@test.com`
3. Navigate to the game URL Player 1 shared
4. Start playing!

## How Online Multiplayer Works

### Game Flow

```
Player 1 (White/Black)          Server (Edge Functions)          Player 2 (Black/White)
      |                                    |                              |
      |------ Create Game (username) ---->|                              |
      |                                    |                              |
      |<----- Game ID + Your Color -------|                              |
      |                                    |                              |
      |                                    |                              |
      |                    Both players navigate to /game/{gameId}       |
      |                                    |                              |
      |------ Make Move (e2->e4) -------->|                              |
      |                                    |                              |
      |                                    |--- Validate Move            |
      |                                    |--- Update Database          |
      |                                    |--- Broadcast via Realtime ->|
      |                                    |                              |
      |<---- Realtime Update --------------|<-----------------------------|
      |                                    |                              |
      |                                    |<----- Make Move (e7->e5) ---|
      |                                    |                              |
      |<---- Realtime Update --------------|----------------------------->|
```

### Turn System

- Colors are **randomly assigned** when game is created
- Only the player whose turn it is can make moves
- Opponent sees "Computer is thinking..." → "White's Turn!" / "Black's Turn!"
- Real-time updates mean both boards update instantly

### Move Validation

Moves are validated **twice**:
1. **Client-side** (chess.js): Instant feedback, shows valid moves
2. **Server-side** (Edge Function): Final authority, prevents cheating

If server rejects a move, it's rolled back on the client.

## Troubleshooting

### "Failed to create game"

**Possible causes:**
1. Edge Functions not deployed
   - Solution: Deploy functions (see step 1 above)

2. Opponent username doesn't exist
   - Solution: Make sure the opponent has signed up
   - Check exact spelling and capitalization

3. Trying to play against yourself
   - Solution: Create a second account

### "Game not found"

**Possible causes:**
1. Invalid game ID in URL
   - Solution: Copy the full URL from Player 1

2. Database not set up
   - Solution: Run the SQL schema from MVP_IMPLEMENTATION_SPEC.md lines 45-116

### "Not authenticated"

**Possible causes:**
1. Not signed in
   - Solution: Sign in before accessing `/game/{gameId}`

2. Session expired
   - Solution: Sign out and sign in again

### Moves not syncing in real-time

**Possible causes:**
1. Realtime not enabled on `moves` table
   - Solution: Go to Supabase Dashboard → Database → Replication
   - Enable realtime for the `moves` table

2. Database trigger not created
   - Solution: Run the trigger SQL from MVP_IMPLEMENTATION_SPEC.md lines 218-242

## Local Development Setup

If you're using **local Supabase** (which you are, based on your .env):

```bash
# Start local Supabase
supabase start

# Your local URLs will be:
# - API: http://127.0.0.1:54321
# - DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# - Studio: http://127.0.0.1:54323
```

Make sure:
1. Local Supabase is running
2. Database schema is set up (tables, RLS, triggers)
3. Edge Functions are deployed locally

## Production Deployment

For production, you'll need:

1. Deploy to Supabase Cloud:
   ```bash
   supabase functions deploy validate-move --project-ref your-project-ref
   supabase functions deploy create-game --project-ref your-project-ref
   ```

2. Update `.env.production`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   ```

3. Deploy frontend to Vercel/Netlify

## Testing Checklist

- [ ] Edge Functions deployed (both create-game and validate-move)
- [ ] Database schema set up (games, moves, profiles tables)
- [ ] RLS policies enabled
- [ ] Database triggers created
- [ ] Two user accounts created
- [ ] Can create a game from home page
- [ ] Both players can access game URL
- [ ] Moves sync in real-time
- [ ] Invalid moves are rejected
- [ ] Game ends on checkmate/stalemate

## Example Game Session

```bash
# Terminal 1 (Player 1)
npm run dev
# Open http://localhost:5173
# Sign in as player1@test.com
# Challenge "Player 2"
# Copy game URL: http://localhost:5173/game/abc-123-def

# Terminal 2 (Player 2) - or incognito browser
# Open http://localhost:5173
# Sign in as player2@test.com
# Navigate to http://localhost:5173/game/abc-123-def
# Start playing!
```

---

**Need help?** Check [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) for technical details.
