function redirectToCity() {
    window.location.href = "../html/city.html";
}

var coinCount = 0;
const lakesound = new Audio("../media/lake.wav");
const coinsound = new Audio("../media/coin.wav");

// Vänta på att hela dokumentet och A-Frame är redo
document.addEventListener("DOMContentLoaded", () => {
    
    // Hämta spelare och kameran
    const scene = document.querySelector("a-scene");
    const player = document.getElementById("player");
    const playerBody = document.getElementById("playerBody");
    console.log(player);

    // Hantera spelarens rörelse
    let playerX = 0, playerZ = -5;
    const speed = 0.06;
    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    document.addEventListener("keydown", (event) => {
        if (event.key in keys) keys[event.key] = true;
    });

    document.addEventListener("keyup", (event) => {
        if (event.key in keys) keys[event.key] = false;
    });

    function update() {
        const player = document.getElementById("player");
        playerX = player.getAttribute("position").x;
        playerZ = player.getAttribute("position").z;
        playerR = player.getAttribute("rotation").y;
        oldPlayerX = playerX;
        oldPlayerZ = playerZ;
        vx = speed * Math.sin(playerR/57.296);
        vz = speed * Math.cos(playerR/57.296);
        if(collideWithSlows(player, playerBody)) {
            vx /= 2;
            vz /= 2;
        }
        
        if(collideWithLake(player, playerBody)) {
            vx /= 2;
            vz /= 2;
            lakesound.play();
        }

        if(collideWithRoads(player, playerBody)) {
            vx *= 2;
            vz *= 2;
        }

        if (keys.ArrowUp)    { playerX -= vx; playerZ -= vz; }
        if (keys.ArrowDown)  { playerX += vx; playerZ += vz; }
        if (keys.ArrowLeft)  { playerX -= vz; playerZ += vx; }
        if (keys.ArrowRight) { playerX += vz; playerZ -= vx; }
        if (playerX < -23) playerX = -23;
        if (playerX >  23) playerX =  23;
        if (playerZ < -23) playerZ = -23;
        if (playerZ >  23) playerZ =  23;

        // Uppdatera spelarens position
        player.setAttribute("position", `${playerX} 0 ${playerZ}`);
        if(collideWithSolids(player, playerBody))
            player.setAttribute("position", `${oldPlayerX} 0 ${oldPlayerZ}`);
        theCoin = collideWithCoins(player, playerBody);
        if (theCoin) {
            coins = document.getElementById("coins");
            coins.removeChild(theCoin);
            coinCount += 1; 
            const coinCounter = document.getElementById("coinCounter");
            coinCounter.setAttribute('text', 'value', 'Coins: ' + coinCount);
            coinsound.play();
        }
        const infoBox = document.getElementById("infoBox");
        if(playerX != oldPlayerX || playerZ != oldPlayerZ)
            infoBox.setAttribute("visible", "false");

        requestAnimationFrame(update);
    }
    
    update();
});


function collideWithSolids(player, playerBody) {
    return collideWithBoxes(player, playerBody, "solids");
}

function collideWithSlows(player, playerBody) {
    return collideWithBoxes(player, playerBody, "slows");
}

function collideWithRoads(player, playerBody) {
    return collideWithBoxes(player, playerBody, "roads");
}

function collideWithBoxes(player, playerBody, aentity) {
    parent = document.getElementById(aentity);
    for(let i=0; i<parent.children.length; i++) {
        let box = parent.children.item(i);
        if(collideWithBox(player, playerBody, box))
            return true
    }
    return false
}

function collideWithBox (player, playerBody, box) {
    playerX = player.getAttribute("position").x
    playerXleft = playerX - playerBody.getAttribute("width")/2
    playerXright = playerX + playerBody.getAttribute("width")/2
    boxX = box.getAttribute("position").x
    boxXleft = boxX - box.getAttribute("width")/2
    boxXright = boxX + box.getAttribute("width")/2

    playerZ = player.getAttribute("position").z
    playerZback = playerZ - playerBody.getAttribute("depth")/2
    playerZfront = playerZ + playerBody.getAttribute("depth")/2
    boxZ = box.getAttribute("position").z
    boxZback = boxZ - box.getAttribute("depth")/2
    boxZfront = boxZ + box.getAttribute("depth")/2
    if ( playerXright > boxXleft && playerXleft < boxXright)
        if ( playerZfront > boxZback && playerZback < boxZfront)
            return true
    return false
}

//Mynt
function collideWithCoins(player, playerBody) {
    coins = document.getElementById("coins");
    for(let i=0; i<coins.children.length; i++) {
        let coin = coins.children.item(i);
        if(collideWithSphere(player, playerBody, coin))
            return coin
    }
    return null
}

function collideWithSphere (player, playerBody, sphere) {
    radius = parseFloat(sphere.getAttribute("radius"));
    playerX = player.getAttribute("position").x;
    playerXleft = playerX - playerBody.getAttribute("width")/2;
    playerXright = playerX + playerBody.getAttribute("width")/2;
    sphereX = sphere.getAttribute("position").x;
    sphereXleft = sphereX - radius;
    sphereXright = sphereX + radius;

    playerZ = player.getAttribute("position").z;
    playerZback = playerZ - playerBody.getAttribute("depth")/2;
    playerZfront = playerZ + playerBody.getAttribute("depth")/2;
    sphereZ = sphere.getAttribute("position").z;
    sphereZback = sphereZ - radius;
    sphereZfront = sphereZ + radius;
    if ( playerXright > sphereXleft && playerXleft < sphereXright) {
        if ( playerZfront > sphereZback && playerZback < sphereZfront) {
            return true;
        }
    }
    return false;
}

//Sjö
function collideWithLake(player, playerBody) {
    const lake = document.getElementById("lake");
    if (lake && collideWithCircle(player, playerBody, lake)) {
        return lake;
    }
    return null;
}

function collideWithCircle(player, playerBody, circle) {
    const radius = parseFloat(circle.getAttribute("radius"));
    //console.log(circle);
    //console.log(circle.getAttribute("radius"));
    //console.log(radius);
    const playerPos = player.getAttribute("position");
    const circlePos = circle.getAttribute("position");
    
    const playerX = playerPos.x;
    const playerZ = playerPos.z;
    const circleX = circlePos.x;
    const circleZ = circlePos.z;
    
    const playerHalfWidth = playerBody.getAttribute("width") / 2;
    const playerHalfDepth = playerBody.getAttribute("depth") / 2;
    
    const playerXleft = playerX - playerHalfWidth;
    const playerXright = playerX + playerHalfWidth;
    const playerZback = playerZ - playerHalfDepth;
    const playerZfront = playerZ + playerHalfDepth;
    
    const dx = Math.max(playerXleft - circleX, 0, circleX - playerXright);
    const dz = Math.max(playerZback - circleZ, 0, circleZ - playerZfront);
    
    return (dx * dx + dz * dz) < (radius * radius);
}
