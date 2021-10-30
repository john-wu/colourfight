let client_id = null;
let websocket = new WebSocket("ws://15.222.5.9:9090");
websocket.onmessage = message => {
    // message to server data
    const response = JSON.parse(message.data);
    
    // connect method
    if (response.method === "connect") {
        client_id = response.client_id;
        console.log("Client id set successfully: " + client_id);
    }
}