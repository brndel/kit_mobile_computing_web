
var peer = null;
var connection = null;

var disconnected = false;

/**
 * Creates a new PeerJS peer and initializes its callbacks
 * @returns The created peer
 */
function createPeer() {
    const peer = new Peer();

    peer.on("open", onPeerOpen);

    peer.on("close", () => console.log("peer close"));
    peer.on("error", err => console.log("peer error", err));

    peer.on("connection", setConnection);
    peer.on("disconnected", () => console.log("peer disconnected"));

    return peer;
}

/**
 * Connects to a remote PeerJS peer
 * @param {string} id The id of the remote peer
 */
function connectToPeer(id) {
    if (id == null) {
        id = peerIdInput.value;
    }

    const conn = peer.connect(id);
    setConnection(conn);
}

function setConnection(conn) {
    connection = conn

    connection.on("open", () => {
        initializeGameScreen();
    })

    connection.on("data", receiveMsg)

    connection.on("close", () => {
        console.log("connection close");
        peer.destroy();
        disconnected = true;
        endGame();
    })
}

/**
 * Sends a message to the connected remote peer
 * @param {*} msg The Message
 */
function sendMsg(msg) {
    connection.send(msg)
}

/**
 * Gets called when a message was sent by the remote peer
 * @param {*} msg 
 */
function receiveMsg(msg) {
    if (msg === "start_game") {
        startGame();
    } else if (msg === "end_game") {
        endGame();
    } else if (msg === "restart_game") {
        restartGame();
    } else if (msg.event == "orientation") {
        onOrientationMsg(msg);
    }
}