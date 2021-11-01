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
app.listen(9091, () => console.log("Listening on port 9091..."));

// create server and listen for requests
const http_server = http.createServer();
http_server.listen(9090, () => console.log("Listening on port 9090..."));

// declare game data objects
const clients = {};
const games = {};

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
        const result = JSON.parse(message.utf8Data);
        
        // user wants to create new game
        if (result.method === "create") {
            const client_id = result.client_id;
            const game_id = uuidv4();
            games[game_id] = {
                "id": game_id,
                "balls": 20
            };

            const payload = {
                "method": "create",
                "game": games[game_id]
            };

            const con = clients[client_id].connection;
            con.send(JSON.stringify(payload));
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
    }

    // send back client connect message
    connection.send(JSON.stringify(payload))

})