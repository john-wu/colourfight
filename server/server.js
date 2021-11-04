const path = require("path");
const http = require("http");
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const ws_server = require("websocket").server;
const { response } = require("express");

const root_dir = path.join(__dirname, "../");

// serve html index
app = express()
app.use(express.static(root_dir))
app.get("/", (req,res) => res.sendFile(root_dir + "views/index.html"));
app.listen(80, () => console.log("Listening on port 80 to serve html..."));

// create server and listen for requests
const http_server = http.createServer();
http_server.listen(8080, () => console.log("Listening on port 8080 for client requests..."));

// declare game data objects
const clients = {};
const games = {};
const player_colours = {
    "0": "red",
    "1": "green",
    "2": "yellow"
};

const websocket_server = new ws_server({
    "httpServer": http_server
});
websocket_server.on("request", request => {

    // accept incoming connection
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("Connection opened!"));
    connection.on("close", () => console.log("Connection closed!"));
    connection.on("message", message => {
        // message received
        const response = JSON.parse(message.utf8Data);
        
        // user wants to create new game
        if (response.method === "create") {
            const client_id = response.client_id;
            const game_id = uuidv4();
            games[game_id] = {
                "id": game_id,
                "balls": 20,
                "clients": {},
                "state": {}
            };

            const payload = {
                "method": "create",
                "game": games[game_id]
            };

            const con = clients[client_id].connection;
            con.send(JSON.stringify(payload));
        };

        // user wants to join existing game
        if (response.method === "join") {
            const client_id = response.client_id;
            const game_id = response.game_id;
            let player_name = response.player_name;
            const game = games[game_id];

            if (!game) {
                return;
            }
            if (Object.keys(game.clients).length >= 3) {
                // max players
                return;
            }

            const player_colour = player_colours[Object.keys(game.clients).length]
            if (player_name === "")
                player_name = player_colour;
            game.clients[client_id] = {
                "player_colour": player_colour,
                "player_name": player_name
            };
            
            // start game once 3 players reached
            if (Object.keys(game.clients).length === 3) {
                start_game(game);
                update_game_state();
            }

            const payload = {
                "method": "join",
                "game": game
            }

            // notify existing players
            for (const client_id of Object.keys(game.clients)) {
                clients[client_id].connection.send(JSON.stringify(payload));
            };
        };

        // user wants to play
        if (response.method === "play") {
            const client_id = response.client_id;
            const game_id = response.game_id;
            const ball_id = response.ball_id;
            const game = games[game_id];
            let state = game.state;

            state[ball_id] = game.clients[client_id];
            games[game_id].state = state;
        };
    });

    // generate a new client_id
    const client_id = uuidv4();
    clients[client_id] = {
        "connection": connection
    };

    const payload = {
        "method": "connect",
        "client_id": client_id
    };

    // send back client connect message
    connection.send(JSON.stringify(payload));
});

function start_game(game) {
    // send start game request to all clients in game
    const payload = {
        "method": "start_game"          
    };

    for (const client_id of Object.keys(game.clients)) {
        clients[client_id].connection.send(JSON.stringify(payload));
    };
};

function update_game_state() {
    // send updated game state to each client for each game
    // {"game_id": "xxxxxxx"}
    for (const g of Object.keys(games)) {
        const game = games[g];

        // calculate total scores
        const scores = {};
        for (const client_id of Object.keys(game.clients)) {
            scores[game.clients[client_id].player_name] = 0; 
        };

        const state = game.state;
        for (const ball_id of Object.keys(state)) {
            scores[state[ball_id].player_name] += 1
        }

        const payload = {
            "method": "update",
            "game": game,
            "scores": scores            
        };

        for (const client_id of Object.keys(game.clients)) {
            clients[client_id].connection.send(JSON.stringify(payload));
        };
    };

    // repeat every 500ms
    setTimeout(update_game_state, 100);
}