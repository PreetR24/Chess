const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "w";
let gameStarted = false;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

io.on("connection", (uniqueSocket) => {
    console.log("A player connected");

    if(!players.white){
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole","w");
    } else if(!players.black){
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole","b");
    } else {
        uniqueSocket.emit("spectatorRole");
    }

    if (Object.keys(players).length === 2 && !gameStarted) {
        gameStarted = true;
        io.emit("gameStarted");
    }

    uniqueSocket.on("move", (move)=>{
        try {
            if (!gameStarted) {
                uniqueSocket.emit("gameNotStarted");
                return;
            }
            
            if (chess.turn() === "w" && uniqueSocket.id !== players.white) return;
            if (chess.turn() === "b" && uniqueSocket.id !== players.black) return;
            
            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }
            else{
                console.log("wrong move");
                uniqueSocket.emit("Invalid move",move);
            }
        } catch (err) {
            console.log("Invalid move");
            uniqueSocket.emit("Invalid move" , move);
        }
        console.log(move);
    });
    
    uniqueSocket.on("disconnect", function() {
        if(uniqueSocket.id === players.white){
            delete players.white;
        }
        else if(uniqueSocket.id === players.black){
            delete players.black;
        }
        
        if (Object.keys(players).length < 2) {
            gameStarted = false;
            io.emit("gameNotStarted");
        }
    });  
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});