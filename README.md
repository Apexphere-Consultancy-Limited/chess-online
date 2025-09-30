# Chess Online

An interactive chess game built with vanilla JavaScript, featuring drag-and-drop gameplay, AI opponents powered by Stockfish, and comprehensive chess rules implementation.

## Features

- **Multiple Game Modes**
  - Play with a friend (local two-player)
  - Play against AI (Easy) - Random moves
  - Play against AI (Medium) - Stockfish depth 3
  - Play against AI (Hard) - Stockfish depth 8

- **Complete Chess Rules**
  - All standard piece movements (pawns, knights, bishops, rooks, queens, kings)
  - Special moves: castling, en passant, pawn promotion
  - Check detection
  - Move validation

- **Interactive UI**
  - Drag-and-drop piece movement
  - Visual move highlighting
  - Turn indicator
  - Captured pieces display
  - Score tracking

- **Game Features**
  - Undo move functionality
  - Visual hint system (3 hints per game using Stockfish)
  - Game reset
  - Victory celebration with fireworks and sound effects
  - Near-promotion pawn highlighting

## Getting Started

### Prerequisites

- Node.js installed on your system

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Game

Start the development server:
```bash
npm run dev
```

Open your browser and navigate to the local URL shown in the terminal (typically `http://localhost:5173`).

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## How to Play

1. **Select Game Mode**: When you start the game, choose your preferred game mode
2. **Move Pieces**: Click and drag pieces to move them
3. **Valid Moves**: Valid destination squares are highlighted when you pick up a piece
4. **Special Moves**:
   - **Castling**: Move king 2 squares toward a rook (if conditions are met)
   - **En Passant**: Capture opponent's pawn that just moved two squares
   - **Promotion**: When a pawn reaches the opposite end, choose a piece to promote to
5. **Use Hints**: Click the hint button to get a suggested move from the AI (3 hints available)
6. **Undo Moves**: Click the undo button to take back your last move
7. **Reset Game**: Start a new game at any time with the reset button

## Technologies Used

- **Vanilla JavaScript** - Core game logic
- **HTML5** - Structure
- **CSS3** - Styling and animations
- **Vite** - Build tool and dev server
- **Stockfish.js** - Chess engine for AI opponents and hints
- **Web Audio API** - Sound effects

## Project Structure

- [index.html](index.html) - Main HTML file
- [main.js](main.js) - Game logic and chess rules
- [style.css](style.css) - Styling
- [stockfish.js](stockfish.js) - Stockfish chess engine
- [vite.config.js](vite.config.js) - Vite configuration

## Game Rules Implemented

- All standard chess piece movements
- Pawn double move from starting position
- Castling (kingside and queenside)
- En passant capture
- Pawn promotion
- Check detection
- Move history tracking
- Piece capture with score calculation

## License

This project is open source and available for educational purposes.