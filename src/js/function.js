function redirectToCity() {
    window.location.href = "../html/city.html";
}

// Vänta på att hela dokumentet och A-Frame är redo
document.addEventListener("DOMContentLoaded", () => {
    // Hämta spelare och kameran
    const scene = document.querySelector("a-scene");
    const player = document.getElementById("player");
    console.log(player);
    const cameraRig = document.querySelector('[follow-box]');
    console.log(cameraRig);
    
    // Koppla follow-box till kamerans rig och spelaren
    if (cameraRig && player) {
        console.log(true)
        cameraRig.setAttribute("follow-box", "target", player);
        player.setAttribute("rotate-with-camera", "");
        console.log(true)
    }

    // Hantera spelarens rörelse
    let playerX = 0, playerZ = -5;
    console.log("here")
    const speed = 0.4;
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

        // Uppdatera spelarens position (kvadraten)
        player.setAttribute("position", `${playerX} 0 ${playerZ}`);

        // Håll kameran på samma höjd men följ spelaren
        const camera = document.getElementById("camera");
        //camera.setAttribute("position", `${playerX} 1.6 ${playerZ + 5}`);

        requestAnimationFrame(update);
    }
    
    update();
});
