const connectionPage = document.getElementById("connection-page");
const gamePage = document.getElementById("game-page");
const gamePlayPage = document.getElementById("game-play-page");
const gameRestartPage = document.getElementById("game-restart-page");

function setPage(id) {
    function checkElement(elem) {
        elem.style.display = elem.id === id ? "" : "none";
    }

    checkElement(connectionPage);
    checkElement(gamePage);
    checkElement(gamePlayPage);
    checkElement(gameRestartPage);
}

const body = document.getElementsByTagName("body")[0];

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

var peer = null;
var connection = null;

function init() {
    if (isMobile) {
        body.classList.add("mobile");
    } else {
        body.classList.add("pc");
    }

    peer = createPeer();
    initConnectionPage();
}

function createPeer() {
    const peer = new Peer();

    peer.on("open", setPeerIdDisplay);

    peer.on("close", () => console.log("peer close"));
    peer.on("error", err => console.log("peer error", err));

    peer.on("connection", setConnection);
    peer.on("disconnected", () => console.log("peer disconnected"));

    return peer;
}

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
        startGameScreen();
    })

    connection.on("data", receiveData)

    connection.on("close", () => {
        console.log("connection close");
        endGame();
        gameOverThroughDisconnect = true;
    })
}


// const virtualPhone = document.getElementById("virtual-phone");

function sendPing() {
    connection.send("ping");
}

function sendMsg(msg) {
    connection.send(msg)
}

function receiveData(msg) {
    // console.log(msg);

    if (msg === "ping") {
        console.log("ping")
        navigator.vibrate(200)
    } else if (msg === "start_game") {
        startGame();
    } else if (msg === "end_game") {
        endGame();
    } else if (msg === "restart_game") {
        restartGame();
    } else if (msg.event == "orientation") {
        onOrientationMsg(msg);
    }
}