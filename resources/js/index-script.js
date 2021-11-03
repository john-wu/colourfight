// game data
let client_id = null;
let game_id = null;
let player_name = null;
let player_colour = null;

// HTML elements

const create_game_button = document.getElementById("create_game_button");
const join_game_button = document.getElementById("join_game_button");
const game_id_input = document.getElementById("game_id_input");
const player_name_input = document.getElementById("player_name_input");
const players_list = document.getElementById("players_list");
const game_board = document.getElementById("game_board");

// Wiring events
create_game_button.addEventListener("click", e => {
    // user wants to create new game
    const payload = {
        "method": "create",
        "client_id": client_id
    };

    websocket.send(JSON.stringify(payload));
});
join_game_button.addEventListener("click", e => {
    // user wants to join existing game
    if (game_id_input.value === "") {
        if (document.getElementById("game_id_required_warning") === null) {
            const div = document.createElement("div");
            div.id = "game_id_required_warning";
            div.style.color = "red";
            div.textContent = "Game ID required";
            document.body.insertBefore(div, game_id_input);
        }
        return
    }

    game_id = game_id_input.value;
    player_name = player_name_input.value;

    const payload = {
        "method": "join",
        "client_id": client_id,
        "game_id": game_id,
        "player_name": player_name
    };

    websocket.send(JSON.stringify(payload));

});


let websocket = new WebSocket("ws://localhost:8080");
websocket.onmessage = message => {
    // received server message
    const response = JSON.parse(message.data);
    
    // receive connect response from server
    if (response.method === "connect") {
        client_id = response.client_id;
        console.log("Client id set successfully: " + client_id);
    };

    // receive create response from server
    if (response.method === "create") {
        game_id = response.game.id
        console.log("Game successfully created, game id: " + response.game.id + ", balls: " + response.game.balls);
    };

    // receive join response from server
    if (response.method === "join") {
        game = response.game;
        console.log(game)

        // clean player list
        while (players_list.firstChild) 
            players_list.removeChild(players_list.firstChild);

        // list players in game
        game.clients.forEach( client => {
            const div = document.createElement("div");
            div.style.width = "200px";
            div.style.background = client.player_colour;
            div.textContent = client.player_name;
            players_list.appendChild(div);

            if (client.client_id === client_id)
                player_colour = client.player_colour;
        });

        // clean game board
        while (game_board.firstChild) 
            game_board.removeChild(game_board.firstChild);

        // populate game board
        for (let i = 0; i < game.balls; i++) {
            const button = document.createElement("button");
            button.id = "ball" + i;
            button.tag = i+1;
            button.style.width = "150px";
            button.style.height = "150px";
            button.addEventListener("click", e => {
                button.style.background = player_colour;
            })
            game_board.appendChild(button)
        }
        
    };
}