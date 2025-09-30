const pieces = {
    'white': {
        'king': '♔',
        'queen': '♕',
        'rook': '♖',
        'bishop': '♗',
        'knight': '♘',
        'pawn': '♙'
    },
    'black': {
        'king': '♚',
        'queen': '♛',
        'rook': '♜',
        'bishop': '♝',
        'knight': '♞',
        'pawn': '♟'
    }
};

const initialBoard = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

let draggedPiece = null;
let originalSquare = null;
let boardState = JSON.parse(JSON.stringify(initialBoard));
let currentPlayer = 'white';

const pieceValues = {
    'pawn': 1,
    'knight': 3,
    'bishop': 3,
    'rook': 5,
    'queen': 9,
    'king': 0
};

let capturedPieces = {
    'white': [],
    'black': []
};

let score = {
    'white': 0,
    'black': 0
};

let gameOver = false;
let awaitingPromotion = false;
let promotionData = null;
let moveHistory = [];
let gameMode = 'friend';

// Stockfish Web Worker integration
let stockfishWorker = null;
let waitingForStockfish = false;

// Visual hint system
let hintsRemaining = 3;
let hintRequestInProgress = false;
let currentHintHighlight = null;

function initializeStockfish() {
    if (!stockfishWorker) {
        stockfishWorker = new Worker('./stockfish.js');

        // Initialize UCI protocol properly
        stockfishWorker.postMessage('uci');
        stockfishWorker.postMessage('isready');
        stockfishWorker.postMessage('ucinewgame');
    }
}

let hasMoved = {
    'white': { 'king': false, 'rookLeft': false, 'rookRight': false },
    'black': { 'king': false, 'rookLeft': false, 'rookRight': false }
};

let enPassantTarget = null;

function getPieceInfo(piece) {
    const pieceMap = {
        '♔': { type: 'king', color: 'white' },
        '♕': { type: 'queen', color: 'white' },
        '♖': { type: 'rook', color: 'white' },
        '♗': { type: 'bishop', color: 'white' },
        '♘': { type: 'knight', color: 'white' },
        '♙': { type: 'pawn', color: 'white' },
        '♚': { type: 'king', color: 'black' },
        '♛': { type: 'queen', color: 'black' },
        '♜': { type: 'rook', color: 'black' },
        '♝': { type: 'bishop', color: 'black' },
        '♞': { type: 'knight', color: 'black' },
        '♟': { type: 'pawn', color: 'black' }
    };
    return pieceMap[piece] || null;
}

// FEN conversion utilities for Stockfish
function boardToFEN() {
    let fen = '';

    // Convert board to FEN notation
    for (let row = 0; row < 8; row++) {
        let emptyCount = 0;
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece === null) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                fen += unicodeToFEN(piece);
            }
        }
        if (emptyCount > 0) {
            fen += emptyCount;
        }
        if (row < 7) fen += '/';
    }

    // Add active color
    fen += ' ' + (currentPlayer === 'white' ? 'w' : 'b');

    // Add castling availability
    let castling = '';
    if (!hasMoved.white.king && !hasMoved.white.rookRight) castling += 'K';
    if (!hasMoved.white.king && !hasMoved.white.rookLeft) castling += 'Q';
    if (!hasMoved.black.king && !hasMoved.black.rookRight) castling += 'k';
    if (!hasMoved.black.king && !hasMoved.black.rookLeft) castling += 'q';
    fen += ' ' + (castling || '-');

    // Add en passant target square (simplified)
    fen += ' -';

    // Add halfmove and fullmove numbers (simplified)
    fen += ' 0 1';

    return fen;
}

function unicodeToFEN(piece) {
    const fenMap = {
        '♔': 'K', '♕': 'Q', '♖': 'R', '♗': 'B', '♘': 'N', '♙': 'P',
        '♚': 'k', '♛': 'q', '♜': 'r', '♝': 'b', '♞': 'n', '♟': 'p'
    };
    return fenMap[piece] || '';
}

function parseStockfishMove(moveStr) {
    if (moveStr.length < 4) return null;

    const fromCol = moveStr.charCodeAt(0) - 97; // a=0, b=1, etc.
    const fromRow = 8 - parseInt(moveStr[1]); // 8=0, 7=1, etc.
    const toCol = moveStr.charCodeAt(2) - 97;
    const toRow = 8 - parseInt(moveStr[3]);

    let promotion = null;
    if (moveStr.length === 5) {
        const promoPiece = moveStr[4];
        const promoMap = { 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight' };
        promotion = promoMap[promoPiece];
    }

    return { fromRow, fromCol, toRow, toCol, promotion };
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    // Forward moves
    if (colDiff === 0 && boardState[toRow][toCol] === null) {
        if (rowDiff === direction) return true;
        if (fromRow === startRow && rowDiff === 2 * direction &&
            boardState[fromRow + direction][fromCol] === null) return true;
    }

    // Diagonal captures
    if (colDiff === 1 && rowDiff === direction) {
        // Normal capture
        if (boardState[toRow][toCol] !== null) {
            const targetPiece = getPieceInfo(boardState[toRow][toCol]);
            if (targetPiece && targetPiece.color !== color) return true;
        }
        // En passant capture
        else if (isValidEnPassant(fromRow, fromCol, toRow, toCol, color)) {
            return true;
        }
    }

    return false;
}

function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;

    const rowDir = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colDir = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

    let currentRow = fromRow + rowDir;
    let currentCol = fromCol + colDir;

    while (currentRow !== toRow || currentCol !== toCol) {
        if (boardState[currentRow][currentCol] !== null) return false;
        currentRow += rowDir;
        currentCol += colDir;
    }

    return true;
}

function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if (rowDiff !== colDiff) return false;

    const rowDir = toRow > fromRow ? 1 : -1;
    const colDir = toCol > fromCol ? 1 : -1;

    let currentRow = fromRow + rowDir;
    let currentCol = fromCol + colDir;

    while (currentRow !== toRow) {
        if (boardState[currentRow][currentCol] !== null) return false;
        currentRow += rowDir;
        currentCol += colDir;
    }

    return true;
}

function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) ||
           isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // Normal king move (1 square in any direction)
    if (rowDiff <= 1 && colDiff <= 1) {
        return true;
    }

    // Castling move (2 squares horizontally)
    if (rowDiff === 0 && colDiff === 2) {
        return isValidCastlingMove(fromRow, fromCol, toRow, toCol);
    }

    return false;
}

function isKingInCheck(color, testBoardState = null) {
    const board = testBoardState || boardState;
    let kingRow = -1;
    let kingCol = -1;

    // Find the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const pieceInfo = getPieceInfo(piece);
                if (pieceInfo && pieceInfo.type === 'king' && pieceInfo.color === color) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
        }
    }

    if (kingRow === -1) return false;

    // Check if any enemy piece can attack the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const pieceInfo = getPieceInfo(piece);
                if (pieceInfo && pieceInfo.color !== color) {
                    // Special case for pawns - they attack diagonally
                    if (pieceInfo.type === 'pawn') {
                        const direction = pieceInfo.color === 'white' ? -1 : 1;
                        if (row + direction === kingRow &&
                            (col + 1 === kingCol || col - 1 === kingCol)) {
                            return true;
                        }
                    } else {
                        // For other pieces, use the normal isValidMove but temporarily ignore the king
                        const tempKing = board[kingRow][kingCol];
                        board[kingRow][kingCol] = null;
                        const canAttack = isValidMove(piece, row, col, kingRow, kingCol);
                        board[kingRow][kingCol] = tempKing;
                        if (canAttack) return true;
                    }
                }
            }
        }
    }

    return false;
}

function isValidEnPassant(fromRow, fromCol, toRow, toCol, color) {
    if (!enPassantTarget) return false;

    // Check if target position matches en passant target
    if (toRow !== enPassantTarget.row || toCol !== enPassantTarget.col) return false;

    // Check if capturing pawn is on correct row for en passant
    const expectedRow = color === 'white' ? 3 : 4;
    if (fromRow !== expectedRow) return false;

    // Check if there's an enemy pawn adjacent that just moved two squares
    const enemyPawnRow = color === 'white' ? 3 : 4;
    const enemyPawn = boardState[enemyPawnRow][toCol];
    if (!enemyPawn) return false;

    const enemyPieceInfo = getPieceInfo(enemyPawn);
    if (!enemyPieceInfo || enemyPieceInfo.type !== 'pawn' || enemyPieceInfo.color === color) return false;

    return true;
}

function isValidCastlingMove(fromRow, fromCol, toRow, toCol) {
    const piece = boardState[fromRow][fromCol];
    const pieceInfo = getPieceInfo(piece);
    if (!pieceInfo || pieceInfo.type !== 'king') return false;

    const color = pieceInfo.color;
    const correctRow = color === 'white' ? 7 : 0;

    // King must be on correct starting row
    if (fromRow !== correctRow) return false;

    // King must not have moved
    if (hasMoved[color].king) return false;

    // King must not be in check
    if (isKingInCheck(color)) return false;

    const isKingside = toCol > fromCol;
    const rookCol = isKingside ? 7 : 0;
    const rookMoveKey = isKingside ? 'rookRight' : 'rookLeft';

    // Rook must not have moved
    if (hasMoved[color][rookMoveKey]) return false;

    // Rook must be in correct position
    const expectedRook = pieces[color].rook;
    if (boardState[correctRow][rookCol] !== expectedRook) return false;

    // Check squares between king and rook are empty
    const start = Math.min(fromCol, rookCol) + 1;
    const end = Math.max(fromCol, rookCol);
    for (let col = start; col < end; col++) {
        if (boardState[correctRow][col] !== null) return false;
    }

    // King must not pass through or end in check
    const testSquares = isKingside ? [fromCol + 1, fromCol + 2] : [fromCol - 1, fromCol - 2];
    for (let testCol of testSquares) {
        const testBoard = JSON.parse(JSON.stringify(boardState));
        testBoard[fromRow][fromCol] = null;
        testBoard[correctRow][testCol] = piece;
        if (isKingInCheck(color, testBoard)) return false;
    }

    return true;
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

    const pieceInfo = getPieceInfo(piece);
    if (!pieceInfo) return false;

    const targetSquare = boardState[toRow][toCol];
    if (targetSquare !== null) {
        const targetInfo = getPieceInfo(targetSquare);
        if (targetInfo && targetInfo.color === pieceInfo.color) return false;
    }

    switch (pieceInfo.type) {
        case 'pawn':
            return isValidPawnMove(fromRow, fromCol, toRow, toCol, pieceInfo.color);
        case 'knight':
            return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case 'rook':
            return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case 'bishop':
            return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case 'queen':
            return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case 'king':
            return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default:
            return false;
    }
}

function getValidMoves(piece, fromRow, fromCol) {
    const validMoves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isValidMove(piece, fromRow, fromCol, row, col)) {
                validMoves.push({ row, col });
            }
        }
    }
    return validMoves;
}

function highlightValidMoves(piece, fromRow, fromCol) {
    clearValidMoves();
    const validMoves = getValidMoves(piece, fromRow, fromCol);
    validMoves.forEach(move => {
        const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
        if (square) {
            square.classList.add('valid-move');
        }
    });
}

function clearValidMoves() {
    document.querySelectorAll('.valid-move').forEach(square => {
        square.classList.remove('valid-move');
    });
}

function showNopeMessage() {
    const existing = document.querySelector('.nope-message');
    if (existing) existing.remove();

    const message = document.createElement('div');
    message.className = 'nope-message';
    message.textContent = 'NOPE!';
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 1000);
}

function showNotYourTurnMessage() {
    const existing = document.querySelector('.not-your-turn-message');
    if (existing) existing.remove();

    const message = document.createElement('div');
    message.className = 'not-your-turn-message';
    message.textContent = 'Not your turn!';
    document.body.appendChild(message);

    setTimeout(() => {
        message.remove();
    }, 1200);
}

function playTurnSwitchSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playCaptureSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.type = 'sawtooth';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function capturePiece(capturedPieceElement, capturingPlayer) {
    const capturedPiece = capturedPieceElement.textContent;
    const capturedPieceInfo = getPieceInfo(capturedPiece);

    if (capturedPieceInfo) {
        // Check if captured piece is a king - GAME OVER!
        if (capturedPieceInfo.type === 'king') {
            handleVictory(capturingPlayer);
            return;
        }

        capturedPieces[capturingPlayer].push(capturedPiece);
        score[capturingPlayer] += pieceValues[capturedPieceInfo.type];

        addCapturedPieceToDisplay(capturedPiece, capturingPlayer);
        updateScoreboard();
        playCaptureSound();
    }
}

function addCapturedPieceToDisplay(piece, capturingPlayer) {
    const capturesList = document.getElementById(capturingPlayer + 'Captures');
    const pieceElement = document.createElement('div');
    pieceElement.className = 'captured-piece';
    pieceElement.textContent = piece;
    capturesList.appendChild(pieceElement);
}

function updateScoreboard() {
    document.getElementById('whiteScore').textContent = score.white + ' points';
    document.getElementById('blackScore').textContent = score.black + ' points';
}

function saveMove(fromRow, fromCol, toRow, toCol, piece, capturedPiece, specialMove = null) {
    const move = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece: piece,
        capturedPiece: capturedPiece,
        specialMove: specialMove,
        boardState: JSON.parse(JSON.stringify(boardState)),
        currentPlayer: currentPlayer,
        capturedPieces: JSON.parse(JSON.stringify(capturedPieces)),
        score: { ...score },
        hasMoved: JSON.parse(JSON.stringify(hasMoved)),
        enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null
    };
    moveHistory.push(move);
    updateUndoButton();
}

function undoLastMove() {
    if (moveHistory.length === 0 || gameOver || awaitingPromotion) return;

    const lastMove = moveHistory.pop();

    // Restore board state
    boardState = JSON.parse(JSON.stringify(lastMove.boardState));
    currentPlayer = lastMove.currentPlayer;
    capturedPieces = JSON.parse(JSON.stringify(lastMove.capturedPieces));
    score = { ...lastMove.score };
    hasMoved = JSON.parse(JSON.stringify(lastMove.hasMoved));
    enPassantTarget = lastMove.enPassantTarget ? { ...lastMove.enPassantTarget } : null;

    // Rebuild the visual board
    rebuildBoard();
    updateTurnIndicator();
    updatePieceGlow();
    updateScoreboard();
    updateCapturedPiecesDisplay();
    highlightNearPromotionPawns();
    updateUndoButton();
}

function rebuildBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.className += (row + col) % 2 === 0 ? ' light' : ' dark';
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = boardState[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = 'piece';
                pieceElement.textContent = piece;
                pieceElement.draggable = true;
                square.appendChild(pieceElement);
            }

            board.appendChild(square);
        }
    }
}

function updateCapturedPiecesDisplay() {
    document.getElementById('whiteCaptures').innerHTML = '';
    document.getElementById('blackCaptures').innerHTML = '';

    capturedPieces.white.forEach(piece => {
        addCapturedPieceToDisplay(piece, 'white');
    });

    capturedPieces.black.forEach(piece => {
        addCapturedPieceToDisplay(piece, 'black');
    });
}

function updateUndoButton() {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.disabled = moveHistory.length === 0 || gameOver || awaitingPromotion;
    }
}

function resetGame() {
    restartGame();
    moveHistory = [];
    updateUndoButton();
}

function showGameModeModal() {
    const modal = document.getElementById('gameModeModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideGameModeModal() {
    const modal = document.getElementById('gameModeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function selectGameMode(mode) {
    gameMode = mode;
    hideGameModeModal();

    // Update the turn indicator if playing with AI
    if (gameMode.startsWith('ai-')) {
        updateTurnIndicator();
    }
}

function getAllValidMovesForPlayer(color) {
    const validMoves = [];

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece) {
                const pieceInfo = getPieceInfo(piece);
                if (pieceInfo && pieceInfo.color === color) {
                    const moves = getValidMoves(piece, row, col);
                    moves.forEach(move => {
                        // Test if this move would leave king in check
                        const testBoard = JSON.parse(JSON.stringify(boardState));
                        testBoard[row][col] = null;
                        testBoard[move.row][move.col] = piece;

                        if (!isKingInCheck(color, testBoard)) {
                            validMoves.push({
                                from: { row, col },
                                to: { row: move.row, col: move.col },
                                piece: piece
                            });
                        }
                    });
                }
            }
        }
    }

    return validMoves;
}

function makeComputerMove() {
    if (!gameMode.startsWith('ai-') || currentPlayer !== 'black' || gameOver || awaitingPromotion || waitingForStockfish) {
        return;
    }

    waitingForStockfish = true;
    const indicator = document.getElementById('turnIndicator');

    // Set personality message and thinking time based on difficulty
    const aiPersonality = getAIPersonality(gameMode);
    indicator.textContent = aiPersonality.thinkingMessage;
    indicator.className = 'turn-indicator black-turn';

    if (gameMode === 'ai-easy') {
        // Easy mode: random moves (original behavior)
        setTimeout(() => {
            makeRandomMove();
        }, 1000);
    } else {
        // Medium and Hard: use Stockfish
        const depth = gameMode === 'ai-medium' ? 3 : 8;
        makeStockfishMove(depth);
    }
}

function getAIPersonality(mode) {
    const personalities = {
        'ai-easy': {
            thinkingMessage: 'YOLO! Random move time!',
            moveMessages: ['This piece looks fun!', 'Why not?', 'Random chaos!', 'Let\'s see what happens!']
        },
        'ai-medium': {
            thinkingMessage: 'Let me think...',
            moveMessages: ['Interesting position!', 'I\'ve got an idea!', 'That looks good!', 'Calculating...']
        },
        'ai-hard': {
            thinkingMessage: 'Analyzing position...',
            moveMessages: ['Found a strong move!', 'Checkmate incoming...', 'Perfect!', 'Excellent position!']
        }
    };
    return personalities[mode] || personalities['ai-easy'];
}

function makeRandomMove() {
    const validMoves = getAllValidMovesForPlayer('black');

    if (validMoves.length === 0) {
        console.log('No valid moves for computer!');
        waitingForStockfish = false;
        return;
    }

    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];

    // Show personality message
    setTimeout(() => {
        const indicator = document.getElementById('turnIndicator');
        const personality = getAIPersonality('ai-easy');
        const randomMessage = personality.moveMessages[Math.floor(Math.random() * personality.moveMessages.length)];
        indicator.textContent = randomMessage;

        setTimeout(() => {
            executeComputerMove(randomMove);
            waitingForStockfish = false;
        }, 500);
    }, 500);
}

function makeStockfishMove(depth) {
    // Initialize Stockfish if not already done
    initializeStockfish();

    const fen = boardToFEN();
    let bestMove = null;
    let moveProcessed = false;

    // Set up message handler for this move
    const moveHandler = (event) => {
        const message = event.data;

        if (typeof message === 'string') {
            console.log('Stockfish:', message);

            if (message.startsWith('bestmove')) {
                const parts = message.split(' ');
                if (parts.length > 1 && parts[1] !== '(none)') {
                    bestMove = parts[1];
                }

                // Remove this handler
                stockfishWorker.removeEventListener('message', moveHandler);
                moveProcessed = true;

                // Execute the move
                if (bestMove) {
                    console.log('Best move from Stockfish:', bestMove);
                    const move = parseStockfishMove(bestMove);

                    if (move) {
                        console.log('Parsed move:', move);

                        // Validate that there's a piece at the source position
                        const piece = boardState[move.fromRow][move.fromCol];
                        const pieceInfo = piece ? getPieceInfo(piece) : null;

                        if (piece && pieceInfo && pieceInfo.color === 'black') {
                            const personality = getAIPersonality(gameMode);
                            const randomMessage = personality.moveMessages[Math.floor(Math.random() * personality.moveMessages.length)];

                            const indicator = document.getElementById('turnIndicator');
                            indicator.textContent = randomMessage;

                            setTimeout(() => {
                                executeStockfishMove(move);
                                waitingForStockfish = false;
                            }, 800);
                        } else {
                            console.log('No valid piece at source position, falling back to random');
                            makeRandomMove();
                        }
                    } else {
                        console.log('Failed to parse Stockfish move, falling back to random');
                        makeRandomMove();
                    }
                } else {
                    console.log('No Stockfish move found, falling back to random');
                    makeRandomMove();
                }
            }
        }
    };

    stockfishWorker.addEventListener('message', moveHandler);

    // Send position and depth to Stockfish with proper UCI protocol
    console.log('Sending FEN to Stockfish:', fen);
    stockfishWorker.postMessage('ucinewgame');
    stockfishWorker.postMessage(`position fen ${fen}`);
    stockfishWorker.postMessage(`go depth ${depth}`);

    // Timeout fallback
    setTimeout(() => {
        if (waitingForStockfish && !moveProcessed) {
            console.log('Stockfish timeout, falling back to random move');
            stockfishWorker.removeEventListener('message', moveHandler);
            makeRandomMove();
        }
    }, 5000); // 5 second timeout
}

function isValidStockfishMove(move) {
    const { fromRow, fromCol, toRow, toCol } = move;

    // Check bounds
    if (fromRow < 0 || fromRow >= 8 || fromCol < 0 || fromCol >= 8 ||
        toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) {
        return false;
    }

    // Check if there's a piece at the from position
    const piece = boardState[fromRow][fromCol];
    if (!piece) return false;

    // Check if it's the right color
    const pieceInfo = getPieceInfo(piece);
    if (!pieceInfo || pieceInfo.color !== 'black') return false;

    // Use existing move validation
    return isValidMove(fromRow, fromCol, toRow, toCol, piece);
}

function executeStockfishMove(move) {
    const { fromRow, fromCol, toRow, toCol, promotion } = move;

    // Get the piece
    const piece = boardState[fromRow][fromCol];
    if (!piece) return;

    // Store captured piece if any
    const targetPiece = boardState[toRow][toCol];
    if (targetPiece) {
        const targetInfo = getPieceInfo(targetPiece);
        if (targetInfo) {
            capturedPieces[targetInfo.color].push(targetPiece);
            score[targetInfo.color === 'white' ? 'black' : 'white'] += pieceValues[targetInfo.type];
        }
    }

    // Handle en passant
    const pieceInfo = getPieceInfo(piece);
    if (pieceInfo && pieceInfo.type === 'pawn' && Math.abs(toCol - fromCol) === 1 && !targetPiece) {
        // En passant capture
        const capturedRow = pieceInfo.color === 'white' ? toRow + 1 : toRow - 1;
        const capturedPawn = boardState[capturedRow][toCol];
        if (capturedPawn) {
            const capturedInfo = getPieceInfo(capturedPawn);
            capturedPieces[capturedInfo.color].push(capturedPawn);
            score[pieceInfo.color] += pieceValues['pawn'];
            boardState[capturedRow][toCol] = null;
        }
    }

    // Update en passant state
    enPassantTarget = null;
    if (pieceInfo && pieceInfo.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
        enPassantTarget = { row: (fromRow + toRow) / 2, col: fromCol };
    }

    // Handle castling
    if (pieceInfo && pieceInfo.type === 'king' && Math.abs(toCol - fromCol) === 2) {
        // Castling move
        const isKingside = toCol > fromCol;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? toCol - 1 : toCol + 1;

        // Move the rook
        boardState[fromRow][rookToCol] = boardState[fromRow][rookFromCol];
        boardState[fromRow][rookFromCol] = null;
    }

    // Update hasMoved flags
    if (pieceInfo) {
        if (pieceInfo.type === 'king') {
            hasMoved[pieceInfo.color].king = true;
        } else if (pieceInfo.type === 'rook') {
            if (fromCol === 0) hasMoved[pieceInfo.color].rookLeft = true;
            if (fromCol === 7) hasMoved[pieceInfo.color].rookRight = true;
        }
    }

    // Move the piece
    boardState[toRow][toCol] = piece;
    boardState[fromRow][fromCol] = null;

    // Handle promotion
    if (promotion) {
        const color = getPieceInfo(piece).color;
        const promotionPiece = pieces[color][promotion];
        boardState[toRow][toCol] = promotionPiece;
    }

    // Add to move history
    moveHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece: piece,
        capturedPiece: targetPiece,
        boardState: JSON.parse(JSON.stringify(boardState)),
        enPassantTarget: enPassantTarget
    });

    // Update the visual board
    rebuildBoard();
    updateCapturedPiecesDisplay();
    updateUndoButton();

    // Check for checkmate (simplified - just check if king can be captured)
    // In a full implementation, you'd check for actual checkmate conditions

    // Switch turns and continue game
    if (!gameOver) {
        switchTurn();
    }
}

function executeComputerMove(move) {
    const { from, to, piece } = move;
    const fromSquare = document.querySelector(`[data-row="${from.row}"][data-col="${from.col}"]`);
    const toSquare = document.querySelector(`[data-row="${to.row}"][data-col="${to.col}"]`);
    const pieceElement = fromSquare.querySelector('.piece');

    if (!pieceElement || !toSquare) return;

    // Handle capture
    let capturedPieceElement = toSquare.querySelector('.piece');
    if (capturedPieceElement) {
        capturePiece(capturedPieceElement, currentPlayer);
        capturedPieceElement.remove();
    }

    // Save move to history
    saveMove(from.row, from.col, to.row, to.col, piece, capturedPieceElement ? capturedPieceElement.textContent : null);

    // Move the piece
    toSquare.appendChild(pieceElement);
    boardState[from.row][from.col] = null;
    boardState[to.row][to.col] = piece;

    // Handle special moves
    const pieceInfo = getPieceInfo(piece);

    // Track double pawn moves for en passant
    if (pieceInfo && pieceInfo.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
        enPassantTarget = {
            row: from.row + (to.row - from.row) / 2,
            col: to.col
        };
    } else {
        enPassantTarget = null;
    }

    // Handle pawn promotion (computer always chooses queen for simplicity)
    if (isPawnPromotion(piece, to.row)) {
        const promotedPiece = pieces.black.queen;
        pieceElement.textContent = promotedPiece;
        boardState[to.row][to.col] = promotedPiece;
    }

    // Track piece movement for castling
    trackPieceMovement(piece, from.row, from.col, to.row, to.col);

    // Switch turn back to human player
    switchTurn();
}

function switchTurn() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    updateTurnIndicator();
    updatePieceGlow();
    highlightNearPromotionPawns();
    playTurnSwitchSound();

    // Clear hints when turn switches
    clearHintsOnMove();

    // If it's the computer's turn in AI mode, make a move
    if (gameMode.startsWith('ai-') && currentPlayer === 'black' && !gameOver && !awaitingPromotion) {
        setTimeout(makeComputerMove, 500); // Small delay before computer starts thinking
    }
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turnIndicator');
    if (currentPlayer === 'white') {
        indicator.textContent = "White's Turn!";
        indicator.className = 'turn-indicator white-turn';
    } else {
        indicator.textContent = "Black's Turn!";
        indicator.className = 'turn-indicator black-turn';
    }
}

function updatePieceGlow() {
    document.querySelectorAll('.piece').forEach(piece => {
        const pieceInfo = getPieceInfo(piece.textContent);
        if (pieceInfo && pieceInfo.color === currentPlayer) {
            piece.classList.add('current-player');
        } else {
            piece.classList.remove('current-player');
        }
    });
}

function createBoard() {
    const board = document.getElementById('board');

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.className += (row + col) % 2 === 0 ? ' light' : ' dark';
            square.dataset.row = row;
            square.dataset.col = col;

            const piece = initialBoard[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = 'piece';
                pieceElement.textContent = piece;
                pieceElement.draggable = true;
                square.appendChild(pieceElement);
            }

            board.appendChild(square);
        }
    }
}

function handleDragStart(e) {
    if (gameOver || awaitingPromotion) {
        e.preventDefault();
        return;
    }

    // Prevent dragging during computer's turn in AI mode
    if (gameMode.startsWith('ai-') && currentPlayer === 'black') {
        e.preventDefault();
        return;
    }

    if (e.target.classList.contains('piece')) {
        const piece = e.target.textContent;
        const pieceInfo = getPieceInfo(piece);

        if (pieceInfo && pieceInfo.color !== currentPlayer) {
            e.preventDefault();
            e.target.classList.add('wrong-turn');
            showNotYourTurnMessage();
            setTimeout(() => {
                e.target.classList.remove('wrong-turn');
            }, 500);
            return;
        }

        draggedPiece = e.target;
        originalSquare = e.target.parentElement;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.textContent);

        const fromRow = parseInt(originalSquare.dataset.row);
        const fromCol = parseInt(originalSquare.dataset.col);
        highlightValidMoves(piece, fromRow, fromCol);
    }
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    const square = e.target.classList.contains('square') ? e.target : e.target.parentElement;
    if (square && square.classList.contains('square')) {
        square.classList.add('highlight');
    }

    return false;
}

function handleDragEnter(e) {
    const square = e.target.classList.contains('square') ? e.target : e.target.parentElement;
    if (square && square.classList.contains('square')) {
        square.classList.add('highlight');
    }
}

function handleDragLeave(e) {
    const square = e.target.classList.contains('square') ? e.target : e.target.parentElement;
    if (square && square.classList.contains('square')) {
        square.classList.remove('highlight');
    }
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    const square = e.target.classList.contains('square') ? e.target : e.target.parentElement;

    if (square && square.classList.contains('square') && draggedPiece) {
        const fromRow = parseInt(originalSquare.dataset.row);
        const fromCol = parseInt(originalSquare.dataset.col);
        const toRow = parseInt(square.dataset.row);
        const toCol = parseInt(square.dataset.col);
        const piece = draggedPiece.textContent;

        if (isValidMove(piece, fromRow, fromCol, toRow, toCol)) {
            let capturedPieceElement = null;

            if (e.target.classList.contains('piece')) {
                capturedPieceElement = e.target;
                capturePiece(capturedPieceElement, currentPlayer);
                e.target.remove();
            }

            // Check move type
            const pieceInfo = getPieceInfo(piece);
            const isCastling = pieceInfo && pieceInfo.type === 'king' && Math.abs(toCol - fromCol) === 2;
            const isEnPassant = pieceInfo && pieceInfo.type === 'pawn' &&
                               boardState[toRow][toCol] === null && Math.abs(toCol - fromCol) === 1;

            // Save move to history before making changes
            saveMove(fromRow, fromCol, toRow, toCol, piece, capturedPieceElement ? capturedPieceElement.textContent : null, isCastling ? 'castling' : isEnPassant ? 'enPassant' : null);

            if (isCastling) {
                executeCastling(fromRow, fromCol, toRow, toCol, square);
            } else if (isEnPassant) {
                executeEnPassant(fromRow, fromCol, toRow, toCol, square);
            } else {
                square.appendChild(draggedPiece);
                boardState[fromRow][fromCol] = null;

                // Track double pawn moves for en passant
                if (pieceInfo && pieceInfo.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
                    enPassantTarget = {
                        row: fromRow + (toRow - fromRow) / 2,
                        col: toCol
                    };
                } else {
                    enPassantTarget = null;
                }

                // Check for pawn promotion
                if (isPawnPromotion(piece, toRow)) {
                    showPromotionDialog(pieceInfo.color, square, toRow, toCol);
                } else {
                    boardState[toRow][toCol] = piece;
                    trackPieceMovement(piece, fromRow, fromCol, toRow, toCol);
                    switchTurn();
                }
            }
        } else {
            originalSquare.appendChild(draggedPiece);
            draggedPiece.classList.add('invalid-move');
            showNopeMessage();
            setTimeout(() => {
                draggedPiece.classList.remove('invalid-move');
            }, 500);
        }
    }

    clearValidMoves();
    return false;
}

function handleDragEnd(e) {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.classList.remove('highlight');
    });

    clearValidMoves();

    if (draggedPiece) {
        draggedPiece.classList.remove('dragging');
        draggedPiece = null;
        originalSquare = null;
    }
}

function handleVictory(winner) {
    gameOver = true;
    playVictoryMusic();
    showFireworks();
    makePiecesCelebrate(winner);
    showVictoryMessage(winner);
}

function playVictoryMusic() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Play a triumphant melody
    const notes = [523, 659, 784, 1047, 784, 659, 523, 659, 784];
    let time = 0;

    notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + time);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.3);

        oscillator.type = 'triangle';
        oscillator.start(audioContext.currentTime + time);
        oscillator.stop(audioContext.currentTime + time + 0.3);

        time += 0.2;
    });
}

function showFireworks() {
    const fireworksContainer = document.createElement('div');
    fireworksContainer.className = 'fireworks';
    document.body.appendChild(fireworksContainer);

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];

    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = Math.random() * 100 + '%';
            firework.style.top = Math.random() * 100 + '%';
            firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            fireworksContainer.appendChild(firework);

            setTimeout(() => {
                firework.remove();
            }, 1500);
        }, i * 100);
    }

    setTimeout(() => {
        fireworksContainer.remove();
    }, 5000);
}

function makePiecesCelebrate(winner) {
    document.querySelectorAll('.piece').forEach(piece => {
        const pieceInfo = getPieceInfo(piece.textContent);
        if (pieceInfo && pieceInfo.color === winner) {
            piece.classList.add('celebrating');
        }
    });
}

function showVictoryMessage(winner) {
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';

    const message = document.createElement('div');
    message.className = 'victory-message';
    message.innerHTML = `CHECKMATE!<br>${winner.toUpperCase()} WINS!`;

    const playAgainBtn = document.createElement('button');
    playAgainBtn.className = 'play-again-btn';
    playAgainBtn.textContent = 'Play Again?';
    playAgainBtn.onclick = restartGame;

    overlay.appendChild(message);
    overlay.appendChild(playAgainBtn);
    document.body.appendChild(overlay);
}

function showPromotionDialog(color, square, toRow, toCol) {
    awaitingPromotion = true;
    promotionData = { color, square, toRow, toCol };

    const modal = document.createElement('div');
    modal.className = 'promotion-modal';
    modal.id = 'promotionModal';

    const dialog = document.createElement('div');
    dialog.className = 'promotion-dialog';

    const title = document.createElement('div');
    title.className = 'promotion-title';
    title.textContent = `Choose promotion piece for ${color}:`;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'promotion-buttons';

    const promotionOptions = [
        { type: 'queen', name: 'Queen' },
        { type: 'rook', name: 'Rook' },
        { type: 'bishop', name: 'Bishop' },
        { type: 'knight', name: 'Knight' }
    ];

    promotionOptions.forEach(option => {
        const button = document.createElement('div');
        button.className = 'promotion-btn';
        button.innerHTML = `${pieces[color][option.type]}<div class="piece-name">${option.name}</div>`;
        button.onclick = () => handlePromotionChoice(option.type);
        buttonsContainer.appendChild(button);
    });

    dialog.appendChild(title);
    dialog.appendChild(buttonsContainer);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
}

function handlePromotionChoice(pieceType) {
    const modal = document.getElementById('promotionModal');
    if (modal) modal.remove();

    if (promotionData) {
        const { color, square, toRow, toCol } = promotionData;
        const promotedPiece = pieces[color][pieceType];

        const pieceElement = square.querySelector('.piece');
        if (pieceElement) {
            pieceElement.textContent = promotedPiece;
        }

        boardState[toRow][toCol] = promotedPiece;

        awaitingPromotion = false;
        promotionData = null;

        switchTurn();
    }
}

function isPawnPromotion(piece, toRow) {
    const pieceInfo = getPieceInfo(piece);
    if (!pieceInfo || pieceInfo.type !== 'pawn') return false;

    return (pieceInfo.color === 'white' && toRow === 0) ||
           (pieceInfo.color === 'black' && toRow === 7);
}

function executeCastling(fromRow, fromCol, toRow, toCol, kingSquare) {
    const pieceInfo = getPieceInfo(draggedPiece.textContent);
    const color = pieceInfo.color;
    const isKingside = toCol > fromCol;
    const rookFromCol = isKingside ? 7 : 0;
    const rookToCol = isKingside ? 5 : 3;

    // Move king
    kingSquare.appendChild(draggedPiece);
    boardState[fromRow][fromCol] = null;
    boardState[toRow][toCol] = draggedPiece.textContent;

    // Move rook
    const rookSquareFrom = document.querySelector(`[data-row="${fromRow}"][data-col="${rookFromCol}"]`);
    const rookSquareTo = document.querySelector(`[data-row="${fromRow}"][data-col="${rookToCol}"]`);
    const rookPiece = rookSquareFrom.querySelector('.piece');

    if (rookPiece) {
        rookSquareTo.appendChild(rookPiece);
        boardState[fromRow][rookFromCol] = null;
        boardState[fromRow][rookToCol] = rookPiece.textContent;
    }

    // Update movement tracking
    hasMoved[color].king = true;
    hasMoved[color][isKingside ? 'rookRight' : 'rookLeft'] = true;

    // Clear en passant target
    enPassantTarget = null;

    switchTurn();
}

function executeEnPassant(fromRow, fromCol, toRow, toCol, square) {
    const piece = draggedPiece.textContent;
    const pieceInfo = getPieceInfo(piece);

    // Move the capturing pawn
    square.appendChild(draggedPiece);
    boardState[fromRow][fromCol] = null;
    boardState[toRow][toCol] = piece;

    // Remove the captured pawn (which is on the same row as the capturing pawn)
    const capturedPawnRow = fromRow;
    const capturedPawnCol = toCol;
    const capturedSquare = document.querySelector(`[data-row="${capturedPawnRow}"][data-col="${capturedPawnCol}"]`);
    const capturedPawnElement = capturedSquare.querySelector('.piece');

    if (capturedPawnElement) {
        capturePiece(capturedPawnElement, currentPlayer);
        capturedPawnElement.remove();
        boardState[capturedPawnRow][capturedPawnCol] = null;
    }

    // Clear en passant target
    enPassantTarget = null;

    switchTurn();
}

function trackPieceMovement(piece, fromRow, fromCol, toRow, toCol) {
    const pieceInfo = getPieceInfo(piece);
    if (!pieceInfo) return;

    const color = pieceInfo.color;

    if (pieceInfo.type === 'king') {
        hasMoved[color].king = true;
    } else if (pieceInfo.type === 'rook') {
        const correctRow = color === 'white' ? 7 : 0;
        if (fromRow === correctRow) {
            if (fromCol === 0) {
                hasMoved[color].rookLeft = true;
            } else if (fromCol === 7) {
                hasMoved[color].rookRight = true;
            }
        }
    }
}

function highlightNearPromotionPawns() {
    document.querySelectorAll('.near-promotion').forEach(square => {
        square.classList.remove('near-promotion');
    });

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = boardState[row][col];
            if (piece) {
                const pieceInfo = getPieceInfo(piece);
                if (pieceInfo && pieceInfo.type === 'pawn') {
                    if ((pieceInfo.color === 'white' && (row === 1 || row === 2)) ||
                        (pieceInfo.color === 'black' && (row === 5 || row === 6))) {
                        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (square) {
                            square.classList.add('near-promotion');
                        }
                    }
                }
            }
        }
    }
}

function restartGame() {
    // Remove victory overlay
    const overlay = document.querySelector('.victory-overlay');
    if (overlay) overlay.remove();

    // Remove promotion modal if present
    const promotionModal = document.querySelector('.promotion-modal');
    if (promotionModal) promotionModal.remove();

    // Reset game state
    gameOver = false;
    awaitingPromotion = false;
    promotionData = null;
    currentPlayer = 'white';
    boardState = JSON.parse(JSON.stringify(initialBoard));
    capturedPieces = { 'white': [], 'black': [] };
    score = { 'white': 0, 'black': 0 };

    // Reset castling tracking
    hasMoved = {
        'white': { 'king': false, 'rookLeft': false, 'rookRight': false },
        'black': { 'king': false, 'rookLeft': false, 'rookRight': false }
    };

    // Reset en passant
    enPassantTarget = null;

    // Clear captured pieces displays
    document.getElementById('whiteCaptures').innerHTML = '';
    document.getElementById('blackCaptures').innerHTML = '';

    // Remove celebrating animation
    document.querySelectorAll('.piece').forEach(piece => {
        piece.classList.remove('celebrating');
    });

    // Recreate board
    document.getElementById('board').innerHTML = '';
    createBoard();
    updateTurnIndicator();
    updatePieceGlow();
    updateScoreboard();
    highlightNearPromotionPawns();

    // Show game mode modal again
    showGameModeModal();

    // Reset hints
    hintsRemaining = 3;
    updateHintButton();
    clearHintHighlight();
}

// Visual Hint System Functions
function getHint() {
    if (hintsRemaining <= 0 || hintRequestInProgress || gameOver) {
        return;
    }

    // Don't give hints during AI turn
    if (gameMode.startsWith('ai-') && currentPlayer === 'black') {
        showHintMessage("Wait for the computer to move first!");
        return;
    }

    hintRequestInProgress = true;
    clearHintHighlight();

    // Use Stockfish for best move suggestions
    getStockfishVisualHint();
}

function getStockfishVisualHint() {
    if (!stockfishWorker) {
        initializeStockfish();
    }

    const fen = boardToFEN();

    const hintHandler = (event) => {
        const message = event.data;

        if (typeof message === 'string' && message.startsWith('bestmove')) {
            const parts = message.split(' ');
            if (parts.length > 1 && parts[1] !== '(none)') {
                const moveStr = parts[1];
                const move = parseStockfishMove(moveStr);

                if (move && isValidVisualHint(move)) {
                    showVisualHint(move);
                    consumeHint();
                } else {
                    showHintMessage("🤔 Hmm, try developing your pieces!");
                    consumeHint();
                }
            } else {
                showHintMessage("🤔 Hmm, try developing your pieces!");
                consumeHint();
            }

            stockfishWorker.removeEventListener('message', hintHandler);
            hintRequestInProgress = false;
        }
    };

    stockfishWorker.addEventListener('message', hintHandler);
    stockfishWorker.postMessage('ucinewgame');
    stockfishWorker.postMessage(`position fen ${fen}`);
    stockfishWorker.postMessage('go depth 3'); // Medium depth for hints

    // Timeout fallback
    setTimeout(() => {
        if (hintRequestInProgress) {
            stockfishWorker.removeEventListener('message', hintHandler);
            showHintMessage("🎯 Try to control the center!");
            consumeHint();
            hintRequestInProgress = false;
        }
    }, 3000);
}

function isValidVisualHint(move) {
    const { fromRow, fromCol, toRow, toCol } = move;

    // Check bounds
    if (fromRow < 0 || fromRow >= 8 || fromCol < 0 || fromCol >= 8 ||
        toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) {
        return false;
    }

    // Check if there's a piece at the from position belonging to current player
    const piece = boardState[fromRow][fromCol];
    if (!piece) return false;

    const pieceInfo = getPieceInfo(piece);
    return pieceInfo && pieceInfo.color === currentPlayer;
}

function showVisualHint(move) {
    const { fromRow, fromCol, toRow, toCol } = move;

    // Find the squares to highlight
    const fromSquare = document.querySelector(`[data-row="${fromRow}"][data-col="${fromCol}"]`);
    const toSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);

    if (fromSquare && toSquare) {
        // Add highlight classes
        fromSquare.classList.add('hint-from');
        toSquare.classList.add('hint-to');

        // Store reference for clearing later
        currentHintHighlight = { fromSquare, toSquare };

        // Determine hint message based on move type
        const targetPiece = boardState[toRow][toCol];
        const piece = boardState[fromRow][fromCol];
        const pieceInfo = getPieceInfo(piece);

        let message;
        if (targetPiece) {
            const encouragingCaptures = ["Nice spot! 💥", "Good capture! 🎯", "Attack! ⚔️", "Take it! 💪"];
            message = encouragingCaptures[Math.floor(Math.random() * encouragingCaptures.length)];
        } else if (pieceInfo && pieceInfo.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            message = "Castle for safety! 🏰";
        } else {
            const encouragingMoves = ["Try this move! ✨", "Good idea! 💡", "Nice spot! 🎯", "Great move! 👍", "Perfect! ⭐"];
            message = encouragingMoves[Math.floor(Math.random() * encouragingMoves.length)];
        }

        showHintMessage(message);
    }
}

function clearHintHighlight() {
    // Remove existing highlights
    document.querySelectorAll('.hint-from, .hint-to').forEach(square => {
        square.classList.remove('hint-from', 'hint-to');
    });

    currentHintHighlight = null;
}

function showHintMessage(message) {
    // Remove any existing hint message
    const existingMessage = document.querySelector('.hint-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const hintMessage = document.createElement('div');
    hintMessage.className = 'hint-message';
    hintMessage.textContent = message;
    document.body.appendChild(hintMessage);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        hintMessage.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            hintMessage.remove();
        }, 300);
    }, 3000);
}

function consumeHint() {
    hintsRemaining--;
    updateHintButton();
}

function updateHintButton() {
    const hintBtn = document.getElementById('hintBtn');
    const hintsLeftSpan = document.getElementById('hintsLeft');

    if (hintsLeftSpan) {
        hintsLeftSpan.textContent = hintsRemaining;
    }

    if (hintBtn) {
        if (hintsRemaining <= 0) {
            hintBtn.disabled = true;
            hintBtn.innerHTML = '💡 No Hints Left';
        } else {
            hintBtn.disabled = gameOver || (gameMode.startsWith('ai-') && currentPlayer === 'black');
        }
    }
}

// Clear hints when player makes a move
function clearHintsOnMove() {
    clearHintHighlight();
}

// Add fade out animation to styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }
`;
document.head.appendChild(styleSheet);

document.addEventListener('DOMContentLoaded', () => {
    // Show game mode selection modal on start
    showGameModeModal();

    createBoard();
    updatePieceGlow();
    updateScoreboard();
    highlightNearPromotionPawns();
    updateUndoButton();

    const board = document.getElementById('board');

    board.addEventListener('dragstart', handleDragStart, false);
    board.addEventListener('dragenter', handleDragEnter, false);
    board.addEventListener('dragover', handleDragOver, false);
    board.addEventListener('dragleave', handleDragLeave, false);
    board.addEventListener('drop', handleDrop, false);
    board.addEventListener('dragend', handleDragEnd, false);

    // Add button event listeners
    document.getElementById('undoBtn').addEventListener('click', undoLastMove);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('hintBtn').addEventListener('click', getHint);

    // Add game mode selection event listeners
    document.getElementById('friendModeBtn').addEventListener('click', () => selectGameMode('friend'));
    document.getElementById('aiEasyBtn').addEventListener('click', () => selectGameMode('ai-easy'));
    document.getElementById('aiMediumBtn').addEventListener('click', () => selectGameMode('ai-medium'));
    document.getElementById('aiHardBtn').addEventListener('click', () => selectGameMode('ai-hard'));
});