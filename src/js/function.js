function redirectToCity() {
    window.location.href = "../html/city.html";
}

// Vänta på att hela dokumentet och A-Frame är redo
document.addEventListener("DOMContentLoaded", () => {
    // Hämta spelare och kameran
    const scene = document.querySelector("a-scene");
    const player = document.getElementById("player");
    console.log(player);

    // Hantera spelarens rörelse
    let playerX = 0, playerZ = -5;
    const speed = 0.2;
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

        requestAnimationFrame(update);
    }
    
    update();
});
