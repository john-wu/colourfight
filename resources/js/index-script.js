// game data
let client_id = null;
let game_id = null;
let player_name = null;
let player_colour = null;
let game_started = false;

// HTML elements
const create_game_button = document.getElementById("create_game_button");
const join_game_button = document.getElementById("join_game_button");
const game_id_text = document.getElementById("game_id_text");
const game_id_input = document.getElementById("game_id_input");
const player_name_input = document.getElementById("player_name_input");
const scoreboard = document.getElementById("scoreboard");
const game_board = document.getElementById("game_board");

// Wiring events
create_game_button.addEventListener("click", create_game);
join_game_button.addEventListener("click", join_game);

let websocket = new WebSocket("ws:www.jozwu.com:8080");
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
        const div = document.createElement("div");
        div.id = "game_id_display";
        div.textContent = "Game created successfully! Game ID: " + game_id;
        document.body.insertBefore(div, game_id_text);
    };

    // receive join response from server
    if (response.method === "join") {
        game = response.game;
        console.log(game);

        // clean player list
        while (scoreboard.firstChild) 
            scoreboard.removeChild(scoreboard.firstChild);

        // list players in game
        for (const c_id of Object.keys(game.clients)) {
            let player_row = scoreboard.insertRow(0);
            let player_name = player_row.insertCell(0);
            let player_score = player_row.insertCell(1);
            
            player_row.style.background = game.clients[c_id].player_colour;
            player_name.innerHTML = game.clients[c_id].player_name;
            player_score.innerHTML = "0";
            player_score.id = game.clients[c_id].player_name + "_score";

            if (c_id === client_id)
                player_colour = game.clients[c_id].player_colour;
        };

        // clean game board
        while (game_board.firstChild) 
            game_board.removeChild(game_board.firstChild);

        // populate game board
        for (let i = 0; i < game.balls; i++) {
            const button = document.createElement("button");
            button.id = "ball" + (i+1);
            button.tag = i+1;
            button.style.width = "150px";
            button.style.height = "150px";

            // play method on button click
            button.addEventListener("click", e => {
                if (!game_started)
                    return;
                button.style.background = player_colour;
                const payload = {
                    "method": "play",
                    "client_id": client_id,
                    "game_id": game_id,
                    "ball_id": button.tag
                };
                websocket.send(JSON.stringify(payload));
            });

            game_board.appendChild(button);        
        };
    };

    // receive update response from server
    if (response.method === "update") {
        if (!response.game.state)
            return;

        // update scores
        for (const p_name of Object.keys(response.scores)) {
            const p_score_cell = document.getElementById(p_name + "_score");
            p_score_cell.innerHTML = response.scores[p_name];
        };

        // {"ball_id": colour}
        for (const ball_id of Object.keys(response.game.state)) {
            const ball_colour = response.game.state[ball_id].player_colour;
            const ball_element = document.getElementById("ball" + ball_id);
            ball_element.style.backgroundColor = ball_colour;
        };
    };

    // receive start_game response from server
    if (response.method === "start_game") {
        game_started = true;
    };
};

function create_game() {
    // user wants to create new game
    const payload = {
        "method": "create",
        "client_id": client_id
    };

    websocket.send(JSON.stringify(payload));
};

function join_game() {
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
};