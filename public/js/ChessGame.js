const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ""; // Clear the board
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",(rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece",square.color === "w" ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square);

                // Allow dragging only if it's the player's turn
                pieceElement.draggable = playerRole === square.color;
                //  && chess.turn() === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                        // alert('Drag started:', sourceSquare); // Debugging line                        
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    // console.log('Drag ended'); // Debugging line
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            // Allow drop on squares
            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSquare);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    // Flip the board if the player is black
    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q", // Always promote to queen for simplicity
    };

    // console.log('Emitting move:', move); // Debugging line

    // socket.emit("move", move);

    if (playerRole) {
        socket.emit("move", move);
    } else {
        alert("Game not started or you are a spectator.");
    }
};


// Listen for player role assignment
socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

// Handle spectators (no moves allowed)
socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

// Update the board state from the server (FEN string)
socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

// Receive move events from the server
socket.on("move", function (move) {
    chess.move(move); // Update chess.js with the move
    renderBoard();
});

socket.on("gameNotStarted", function () {
    alert("The game cannot start until both players are connected.");
});

socket.on("gameStarted", function () {
    alert("The game has started!");
});

// Function to convert chess pieces to their Unicode equivalent
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        K: "♔", // White King (Standard)
        Q: "♕", // White Queen (Standard)
        R: "♖", // White Rook (Standard)
        B: "♗", // White Bishop (Standard)
        N: "♘", // White Knight (Standard)
        P: "♙", // White Pawn (Standard)
        k: "♚", // Black King (Standard)
        q: "♛", // Black Queen (Standard)
        r: "♜", // Black Rook (Standard)
        b: "♝", // Black Bishop (Standard)
        n: "♞", // Black Knight (Standard)
        p: "♙", // Black Pawn (Standard)
    };
    
    return unicodePieces[piece.type] || "";
    // return unicodePieces[piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase()] || "";
};

// Initial rendering of the chessboard
renderBoard();