function redirectToCity() {
    window.location.href = "../html/city.html";
}

// Vänta på att hela dokumentet och A-Frame är redo
document.addEventListener("DOMContentLoaded", () => {
    
    // Hämta spelare och kameran
    const scene = document.querySelector("a-scene");
    const player = document.getElementById("player");
    const playerBody = document.getElementById("playerBody");
    console.log(player);

    // Hantera spelarens rörelse
    let playerX = 0, playerZ = -5;
    const speed = 0.07;
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
        playerX = player.getAttribute("position").x
        playerZ = player.getAttribute("position").z
        oldPlayerX = playerX
        oldPlayerZ = playerZ
        if (keys.ArrowUp) playerZ -= speed;
        if (keys.ArrowDown) playerZ += speed;
        if (keys.ArrowLeft) playerX -= speed;
        if (keys.ArrowRight) playerX += speed;
        if (playerX < -23) playerX = -23;
        if (playerX >  23) playerX =  23;
        if (playerZ < -23) playerZ = -23;
        if (playerZ >  23) playerZ =  23;

        // Uppdatera spelarens position (kvadraten)

        player.setAttribute("position", `${playerX} 0 ${playerZ}`);
        if(collideWithSolids(player, playerBody))
            player.setAttribute("position", `${oldPlayerX} 0 ${oldPlayerZ}`);

        requestAnimationFrame(update);
    }
    
    update();
});

function collideWithSolids(player, playerBody) {
    solids = document.getElementById("solids");
    for(let i=0; i<solids.children.length; i++) {
        let box = solids.children.item(i);
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
