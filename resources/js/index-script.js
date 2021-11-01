// HTML elements
const create_game_button = document.getElementsByClassName("create_game_button")[0];

// Wiring events
create_game_button.addEventListener("click", e => {
    // user wants to create new game
    const payload = {
        "method": "create",
        "client_id": client_id
    };

    websocket.send(JSON.stringify(payload));
});

let client_id = null;
let websocket = new WebSocket("ws://localhost:9090");
websocket.onmessage = message => {
    // received server message
    const response = JSON.parse(message.data);
    
    // receive connect response from server
    if (response.method === "connect") {
        client_id = response.client_id;
        console.log("Client id set successfully: " + client_id);
    }

    // receive create response from server
    if (response.method === "create") {
        console.log("Game successfully created, game id: " + response.game.id + ", balls: " + response.game.balls);
    }
}