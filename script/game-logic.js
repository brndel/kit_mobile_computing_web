
/**
 * Needs to be called from mobile
 * 
 * Starts the game on the desktop and registers motion callbacks on mobile
 */
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

/**
 * Needs to be called from desktop
 * 
 * sets `gameOver = true` on desktop and shows a restart button on mobile
 */
function endGame() {
    if (!isMobile) {
        sendMsg("end_game");

        gameOver = true;
        gameOverAnimFrame = 0;
    } else {
        // Only chrome on android supports vibration, so we need to check if the function exists in the current browser
        if (navigator.vibrate !== undefined) {
            navigator.vibrate([100, 10, 50])
        }

        if (disconnected) {
            setPage("connection-lost-page");
        } else {
            setPage("game-restart-page");
        }
    }
}

/**
 * Needs to be called from mobile
 * 
 * starts the game again
 */
function restartGame() {
    if (isMobile) {
        sendMsg("restart_game");
        setPage("game-play-page");
    }

    gameOver = false;
    gameState = initialGameState();
}


const gamePlayCanvas = document.getElementById("game-play-canvas");
const gameCtx = gamePlayCanvas.getContext("2d");


// Game variables

const initialGameState = () => {
    return {
        score: 0,
        objects: [],
        nextObjectSpawnTimestamp: lastFrameTimestamp,
    }
}

var lastFrameTimestamp = 0;

var gameState = initialGameState();

var gameOver = false;
var gameOverAnimFrame = 0;


var platform = {
    rotation: 0.0,
    width: 100,
    height: 50,
}

// --

function onOrientationMsg(msg) {
    let rot = msg.rotation;

    // When the phone gets rotated too much in the forward/backward direction, the rotation value flips
    // This corrects the flipped rotation
    if (rot > 90) {
        rot = 180 - rot;
    } else if (rot < -90) {
        rot = -180 - rot
    }

    // clamp rotation to -80..80
    if (rot < -80) {
        rot = -80;
    } else if (rot > 80) {
        rot = 80;
    }

    platform.rotation = rot;
}


/**
 * Creates a new randomized object
 * @returns A new randomized object
 */
function createObject() {
    return {
        x: Math.random() * gamePlayCanvas.width * 0.8 + gamePlayCanvas.width * 0.1,
        y: -50,
        rot: Math.random() * 2 * Math.PI,
        angular_velocity: (Math.random() * 2 - 1) * Math.PI,
        // 90% of objects are 'good', they increase the score when collected
        // 10% of objects are 'bad', they end the game when collected
        type: Math.random() > 0.1 ? "good" : "bad",
    };
}

/**
 * Moves and rotates the given object
 * @param {*} obj 
 * @param {*} delta 
 */
function moveObject(obj, delta) {
    obj.y += 200.0 * delta;
    obj.rot += obj.angular_velocity * delta;
    if (obj.type == "bad") {

        // Only teleport bad objects in the upper half of the canvas, so they don't teleport into the platform and the user can't react
        if (obj.y < gamePlayCanvas.height / 2) {
            // Sometimes teleport the bad objects left or right
            if (Math.random() < 0.1) {
                obj.x += (Math.random() * 100 + 20) * (Math.random() > 0.5 ? 1 : -1);
                // clamp the position to stay inside of the canvas
                if (obj.x < 50) {
                    obj.x = 50;
                } else if (obj.x > gamePlayCanvas.width - 50) {
                    obj.x = gamePlayCanvas.width - 50;
                }
            }

            // Sometimes teleport the bad objects down
            if (Math.random() < 0.05) {
                obj.y += Math.random() * 100;
            }
        }
    }
}

/**
 * Tests the collision between the given object and the platform.
 * Returns `true` if the object collides with the platform and should be deleted
 * 
 * @param {*} obj 
 * @param {*} platformPos 
 * @returns wheter the object should be deleted
 */
function testCollideObject(obj, platformPos) {
    if (obj.y > platformPos.y - platform.height / 2 && obj.y < platformPos.y + platform.height / 2) {
        if (obj.x > platformPos.x - platform.width / 2 && obj.x < platformPos.x + platform.width / 2) {
            if (obj.type == "good") {
                gameState.score += 1;
                return true;
            } else if (obj.type == "bad") {
                endGame();
                // Do not delete the object, so the player can see the object that hit them
                return false;
            }
        }
    }

    return false;
}

function updateGame(timestamp) {
    // delta = time since the last frame in seconds 
    const delta = (timestamp - lastFrameTimestamp) / 1000.0;
    lastFrameTimestamp = timestamp;

    if (!gameOver) {
        gameState.objects.forEach(obj => {
            moveObject(obj, delta);
        })

        gameState.objects = gameState.objects.filter(obj => obj.y < (gamePlayCanvas.height + 50));

        if (timestamp > gameState.nextObjectSpawnTimestamp) {
            gameState.nextObjectSpawnTimestamp = timestamp + Math.random() * 1000 + 200;

            gameState.objects.push(createObject())
        }

        const platformPos = calculatePlaformPos(platform.rotation);

        gameState.objects = gameState.objects.filter(obj => {
            return !testCollideObject(obj, platformPos)
        });
    }

    if (gameOver) {
        if (gameOverAnimFrame < 20) {
            gameOverAnimFrame += 1;
        }
    }

    updateCanvas();

    if (pages["game-play-page"].style.display !== "none") {
        requestAnimationFrame(updateGame);
    }
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

    // clear the background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, gamePlayCanvas.width, gamePlayCanvas.height);

    drawPlatformRail(ctx, fgColor);


    let pos = calculatePlaformPos(platform.rotation);

    // transform the canvas to draw the platform
    ctx.translate(pos.x, pos.y);
    ctx.rotate(platform.rotation / 180 * Math.PI / 4.0);

    // draw the platform
    ctx.fillStyle = fgColor;
    ctx.fillRect(-platform.width / 2, -platform.height / 2, platform.width, platform.height);

    // draw the current score on the platform
    ctx.fillStyle = bgColor;
    ctx.textAlign = "center";
    ctx.font = "40px Verdana";
    ctx.fillText(gameState.score.toString(), 0, 15);
    ctx.resetTransform();

    // draw all objects
    gameState.objects.forEach(obj => {
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rot);
        switch (obj.type) {
            // Draw a basic square for good objects
            case "good":
                ctx.fillStyle = fgColor;
                ctx.fillRect(-10, -10, 20, 20);
                break;
            // Draw a 'glitchy' circle for bad objects
            case "bad":
                function randomTriangle() {
                    ctx.moveTo(Math.random() * 40.0 - 20, Math.random() * 40.0 - 20);
                    ctx.lineTo(Math.random() * 40.0 - 20, Math.random() * 40.0 - 20);
                    ctx.lineTo(Math.random() * 40.0 - 20, Math.random() * 40.0 - 20);
                }

                // Draw random 'glitchy' triangles around the circle in red, green and blue
                ["red", "green", "blue"].forEach(color => {
                    ctx.beginPath();
                    randomTriangle();
                    ctx.fillStyle = color;
                    ctx.fill();
                });

                // Draw a circle and add a random triangle to the path to make it extra 'glitchy'
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, 2 * Math.PI);
                randomTriangle();
                ctx.fillStyle = "black";
                ctx.fill();


                break;
        }
        ctx.resetTransform();
    });

    if (gameOver && disconnected) {
        ctx.fillStyle = fgColor;
        ctx.textAlign = "center";
        ctx.font = "80px Verdana";
        ctx.fillText("Connection lost", gamePlayCanvas.width / 2.0, gamePlayCanvas.height / 2.0);
    }
}

/**
 * Draw a line to show the positions the platform can be in
 */
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
    y += gamePlayCanvas.height * 3.0 / 4.0 - platform.height;

    return {
        x: x,
        y: y,
    }
}