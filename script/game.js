const gamePageHeader = document.getElementById("game-page-header");
const gameStartButton = document.getElementById("game-start-button");

function startGameScreen() {
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

function startGame() {
    if (isMobile) {
        registerMotionCallbacks();
        sendMsg("start_game");
    }

    setPage("game-play-page");

    if (!isMobile) {
        requestAnimationFrame(updateGame);
    }
}

async function registerMotionCallbacks() {
    console.log("registering listeners");
    try {
        // if (DeviceMotionEvent.requestPermission !== undefined) {
        //     let resp = await DeviceMotionEvent.requestPermission()
        // }
        // window.addEventListener("devicemotion", handleMotion)

        if (DeviceOrientationEvent.requestPermission !== undefined) {
            let resp = await DeviceOrientationEvent.requestPermission()

        }
        window.addEventListener("deviceorientation", onDeviceOrientation)

    } catch (err) {
        console.log(err)
        // btn.textContent = err
    }
}


function onDeviceOrientation(event) {
    if (isMobile) {
        sendMsg({
            event: "orientation",
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma
        })
    }
}


// const roatationHandle = document.getElementById("game-rotation-handle");

/** @type {HTMLCanvasElement} */
const gamePlayCanvas = document.getElementById("game-play-canvas");

/** @type {CanvasRenderingContext2D} */
const gameCtx = gamePlayCanvas.getContext("2d");

function onOrientationMsg(msg) {
    // roatationHandle.style.transform = `rotateZ(${-msg.alpha}deg) rotateX(${-msg.beta}deg) rotateY(${msg.gamma}deg)`;
    // roatationHandle.style.transform = `rotate(${msg.beta}deg)`;
    rotation = msg.beta;

    // When the phone gets rotated too much in the forward/backward direction, the beta rotation flips
    // This corrects the flipped rotation
    if (rotation > 90) {
        rotation = 180 - rotation;
    } else if (rotation < -90) {
        rotation = -180 - rotation
    }

    // clamp rotation to -80..80
    if (rotation < -80) {
        rotation = -80;
    } else if (rotation > 80) {
        rotation = 80;
    }
}

var rotation = 0.0;

var gameObjects = [];
var lastFrameTS = 0;
var nextSquareSpawnTS = 0;

var score = 0;
var gameOver = false;
var gameOverAnimFrame = 0;
var gameOverThroughDisconnect = false;

const PLATFORM_WIDTH = 100;
const PLATFORM_HEIGHT = 50;

function updateGame(timestamp) {
    const delta = (timestamp - lastFrameTS) / 1000.0;
    lastFrameTS = timestamp;

    if (!gameOver) {
        gameObjects.forEach(obj => {
            obj.y += 200.0 * delta;
            obj.rot += obj.angular_velocity * delta;
            if (obj.type == "bad" && obj.y < gamePlayCanvas.height / 2) {
                if (Math.random() < 0.1) {
                    obj.x += (Math.random() * 100 + 20) * (Math.random() > 0.5 ? 1 : -1);
                    if (obj.x < 50) {
                        obj.x = 50;
                    } else if (obj.x > gamePlayCanvas.width - 50) {
                        obj.x = gamePlayCanvas.width - 50;
                    }
                }

                if (Math.random() < 0.05) {
                    obj.y += Math.random() * 100;
                }
            }
        })

        gameObjects = gameObjects.filter(obj => obj.y < (gamePlayCanvas.height + 50));

        if (timestamp > nextSquareSpawnTS) {
            nextSquareSpawnTS = timestamp + Math.random() * 1000 + 200;

            gameObjects.push({
                x: Math.random() * gamePlayCanvas.width * 0.8 + gamePlayCanvas.width * 0.1,
                y: -50,
                rot: Math.random() * 2 * Math.PI,
                angular_velocity: (Math.random() * 2 - 1) * Math.PI,
                type: Math.random() > 0.1 ? "good" : "bad",
            })
        }

        const platformPos = calculatePlaformPos(rotation, gamePlayCanvas);

        gameObjects = gameObjects.filter(obj => {
            if (obj.y > platformPos.y - PLATFORM_HEIGHT / 2 && obj.y < platformPos.y + PLATFORM_HEIGHT / 2) {
                if (obj.x > platformPos.x - PLATFORM_WIDTH / 2 && obj.x < platformPos.x + PLATFORM_WIDTH / 2) {
                    if (obj.type == "good") {
                        score += 1;
                        return false;
                    } else if (obj.type == "bad") {
                        endGame();
                        return true;
                    }
                }
            }

            return true;
        });
    }

    if (gameOver) {
        if (gameOverAnimFrame < 20) {
            gameOverAnimFrame += 1;
        }
    }

    updateCanvas();

    if (gamePlayPage.style.display !== "none") {
        requestAnimationFrame(updateGame);
    }
}

function endGame() {
    if (!isMobile) {
        sendMsg("end_game");

        gameOver = true;
        gameOverAnimFrame = 0;
    } else {
        if (navigator.vibrate !== undefined) {
            navigator.vibrate([100, 10, 50])
        }
        if (gameOverThroughDisconnect) {
            setPage("connection-lost-page");
        } else {
            setPage("game-restart-page");
        }
    }
}

function restartGame() {
    if (isMobile) {
        sendMsg("restart_game");
        setPage("game-play-page");
    }

    gameOver = false;
    score = 0;
    gameObjects = [];
    nextSquareSpawnTS = lastFrameTS;
}

function updateCanvas() {
    const ctx = gameCtx;


    if (gameOver) {
        if (gameOverAnimFrame % 4 < 2) {
            var bgColor = "black";
            var fgColor = "white";
        } else {
            var bgColor = "white";
            var fgColor = "black";
        }
    } else {
        var bgColor = "coral";
        var fgColor = "bisque";
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, gamePlayCanvas.width, gamePlayCanvas.height);

    drawPlatformRail(ctx, fgColor);


    let pos = calculatePlaformPos(rotation);

    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation / 180 * Math.PI / 4.0);

    ctx.fillStyle = fgColor;
    ctx.fillRect(-PLATFORM_WIDTH / 2, -PLATFORM_HEIGHT / 2, PLATFORM_WIDTH, PLATFORM_HEIGHT);

    ctx.fillStyle = bgColor;
    ctx.textAlign = "center";
    ctx.font = "40px Verdana";
    ctx.fillText(score.toString(), 0, 15);
    ctx.resetTransform();

    gameObjects.forEach(obj => {
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rot);
        switch (obj.type) {
            case "good":
                ctx.fillStyle = fgColor;
                ctx.fillRect(-10, -10, 20, 20);
                break;
            case "bad":

                function randomTriangle() {
                    ctx.moveTo(Math.random() * 40.0 - 20, Math.random() * 40.0 - 20);
                    ctx.lineTo(Math.random() * 40.0 - 20, Math.random() * 40.0 - 20);
                    ctx.lineTo(Math.random() * 40.0 - 20, Math.random() * 40.0 - 20);
                }

                ["red", "green", "blue"].forEach(color => {
                    ctx.beginPath();
                    randomTriangle();
                    ctx.fillStyle = color;
                    ctx.fill();
                });


                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, 2 * Math.PI);
                randomTriangle();
                ctx.fillStyle = "black";
                ctx.fill();


                break;
        }
        ctx.resetTransform();
    });

    if (gameOver && gameOverThroughDisconnect) {
        ctx.fillStyle = fgColor;
        ctx.textAlign = "center";
        ctx.font = "80px Verdana";
        ctx.fillText("Connection lost", gamePlayCanvas.width / 2.0, gamePlayCanvas.height / 2.0);
    }
}

function drawPlatformRail(ctx, color) {
    ctx.strokeStyle = color;

    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    ctx.beginPath();
    const initPos = calculatePlaformPos(-80);
    ctx.moveTo(initPos.x, initPos.y);


    for (let rot = -78; rot <= 80; rot += 2) {
        let pos = calculatePlaformPos(rot);
        ctx.lineTo(pos.x, pos.y);
    }

    ctx.stroke();
}

function calculatePlaformPos(rotation) {
    const rotRad = rotation / 180 * Math.PI;

    let x = Math.sin(-rotRad) * gamePlayCanvas.width / 2.0;
    let y = Math.cos(rotRad) * gamePlayCanvas.height / 4.0;

    x += gamePlayCanvas.width / 2.0;
    y += gamePlayCanvas.height * 3.0 / 4.0 - PLATFORM_HEIGHT;

    return {
        x: x,
        y: y,
    }
}