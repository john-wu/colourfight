const path = require("path");
const http = require("http");
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const ws_server = require("websocket").server;

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
    "0": "Red",
    "1": "Green",
    "2": "Blue"
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
                "clients": []
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

            if (game.clients.length >= 3) {
                // max players
                return;
            }

            const player_colour = player_colours[game.clients.length]
            if (player_name === "")
                player_name = player_colour;
            game.clients.push({
                "client_id": client_id,
                "player_colour": player_colour,
                "player_name": player_name
            })

            const payload = {
                "method": "join",
                "game": game
            }

            // notify existing players
            game.clients.forEach(client => {
                clients[client.client_id].connection.send(JSON.stringify(payload));
            });
        }
    });

    // generate a new client_id
    const client_id = uuidv4();
    clients[client_id] = {
        "connection": connection
    };

    const payload = {
        "method": "connect",
        "client_id": client_id
    }

    // send back client connect message
    connection.send(JSON.stringify(payload))

})