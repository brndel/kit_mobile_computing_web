const gamePageHeader = document.getElementById("game-page-header");
const gameStartButton = document.getElementById("game-start-button");

function initializeGameScreen() {
    setPage("game-page");

    if (isMobile) {
        screen.orientation.addEventListener("change", onOrientationChange);
        onOrientationChange();
        gameStartButton.onclick = startGame;
    } else {
        gamePageHeader.textContent = "Follow the instructions on your mobile phone"
    }
}

function onOrientationChange() {
    switch (screen.orientation.type) {
        case "landscape-primary":
            gamePageHeader.textContent = "Ready?";
            gameStartButton.removeAttribute("disabled");
            break;
        case "landscape-secondary":
            gamePageHeader.textContent = "Turn your phone by 180°";
            gameStartButton.setAttribute("disabled", true);
            break;
        default:
            gamePageHeader.textContent = "Turn your phone to landscape mode";
            gameStartButton.setAttribute("disabled", true);
    }
}

async function registerMotionCallbacks() {
    console.log("registering listeners");
    try {
        if (DeviceOrientationEvent.requestPermission !== undefined) {
            await DeviceOrientationEvent.requestPermission()
        }
        window.addEventListener("deviceorientation", onDeviceOrientation)

    } catch (err) {
        console.log(err)
    }
}


function onDeviceOrientation(event) {
    if (isMobile) {
        sendMsg({
            event: "orientation",
            rotation: event.beta,
        })
    }
}
