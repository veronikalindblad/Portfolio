function redirectToCity() {
    window.location.href = "../html/city.html";
}

var coinCount = 0;
var totalHouses = 0;      
var visitedHouses = 0;
var houseVisited = {}; 
var activeHouse = null;
var isSpacePressed = false;
var isSpaceReleased = false;
var inSlow = false;
var inLake = false;
const lakesound = new Audio("../media/lake.wav");
const coinsound = new Audio("../media/coin.wav");
const slowssound = new Audio("../media/slows.wav");
const placessound = new Audio("../media/places.wav");

var isWalking = false;
var bounceTimer = null;
var bounceHeight = 0.08;
var bounceSpeed = 150; // milliseconds
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Vänta på att hela dokumentet och A-Frame är redo
document.addEventListener("DOMContentLoaded", () => {
      
      // Genererar slumpmässig siffra
      function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      
      // Genererar slumpmässig grå
      function randomGrayShade() {
        const shade = randomInt(100, 200).toString(16);
        return `#${shade}${shade}${shade}`;
      }
      
      // Hämtar alla hus
      const houses = document.querySelectorAll('.house');
      const windowsContainer = document.getElementById('windows');
      
      // Varje hus
      houses.forEach(house => {
        // Slumpmässig färg
        const grayShade = randomGrayShade();
        house.setAttribute('color', grayShade);
        
      });
    
    // Hämta spelare och kameran
    const scene = document.querySelector("a-scene");
    const player = document.getElementById("player");
    const playerBody = document.getElementById("playerBody");

    // Hantera spelarens rörelse
    let playerX = 0, playerZ = -5;
    const speed = 0.06;

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
            if(!inSlow)
                slowssound.play();
            inSlow = true;
        } else inSlow = false;
        
        if(collideWithLake(player, playerBody)) {
            vx /= 2;
            vz /= 2;
            if(!inLake)
                lakesound.play();
            inLake = true;
        } else inLake = false;

        if(collideWithRoads(player, playerBody)) {
            vx *= 1.3;
            vz *= 1.3;
        }

        const place = collideWithPlaces(player, playerBody);
        if(place) {
            const info = document.getElementById(place.id + "Info");
            if (info && info.getAttribute("visible") == false) {
                placessound.play();
                hideSigns();
                info.setAttribute("visible", "true");
                var signTimer = setTimeout(() => {
                    const info = document.getElementById(place.id + "Info");
                    if (info && info.parentNode)
                        info.parentNode.removeChild(info);
                    if (place && place.parentNode)
                        place.parentNode.removeChild(place);
                    return;
                    }, 
                    4000
                );    
            }    
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
        // Uppdatera spelarens riktning
        const playerAngles = {
            true: { // Up
                true: { // Up + Down
                    true: { true: -1, false: -1 },
                    false: { true: -1, false: -1 }
                },
                false: { // Up + not Down
                    true: { true: -1, false: 225 }, // Up and Left
                    false: { true: 135, false: 180 } // Up and Right, only Up
                }
            },
            false: { // not Up
                true: { // not Up + Down
                    true: { true: -1, false: 315 }, // Down + Left
                    false: { true: 45, false: 0 } // Down + Right, only Down
                },
                false: { // not Up + not Down
                    true: { true: -1, false: 270 }, // only Left
                    false: { true: 90, false: -2 } // only Right
                }
            },
        }
        playerRot = playerAngles[keys.ArrowUp][keys.ArrowDown][keys.ArrowLeft][keys.ArrowRight];
        if (playerRot >= 0)
            playerBody.setAttribute("rotation", `0 ${playerRot} 0`);

        const houseCollision = collideWithHouses(player, playerBody);
        if(houseCollision || collideWithSolids(player, playerBody))
            player.setAttribute("position", `${oldPlayerX} 0 ${oldPlayerZ}`);

        if(houseCollision) {
            activeHouse = houseCollision;
            const outsideHouse = document.getElementById("outsideHouse");
            if (outsideHouse && outsideHouse.getAttribute("visible") == false) {
                placessound.play();
                hideSigns();
                outsideHouse.setAttribute("visible", "true");
                var signTimer = setTimeout(() => {
                    outsideHouse.setAttribute("visible", "false");
                    activeHouse = null;
                    return;
                    }, 
                    5000
                );    
            }    
        }    

        if(isSpacePressed) {
            spacePressed(activeHouse);
        }

        if(player.getAttribute("position").x != oldPlayerX || player.getAttribute("position").z != oldPlayerZ) {
            outsideHouse.setAttribute("visible", "false");
        }

        theCoin = collideWithCoins(player, playerBody);
        if (theCoin) {
            coins = document.getElementById("coins");
            coins.removeChild(theCoin);
            coinCount += 1; 
            const coinCounter = document.getElementById("coinCounter");
            coinCounter.setAttribute('text', 'value', coinCount);
            coinsound.play();
        }
        const infoBox = document.getElementById("infoBox");
        if(playerX != oldPlayerX || playerZ != oldPlayerZ)
            infoBox.setAttribute("visible", "false");

        rotateCoins();

        requestAnimationFrame(update);
    }
    setupHouseProgressBar();
    setupDogAnimation();
    update();
});

var rot = 0;
function rotateCoins() {
    coins = document.getElementById("coins");
    rot += 2;
    for(let i=0; i<coins.children.length; i++) {
        let coin = coins.children.item(i);
        coin.setAttribute("rotation", `90 ${rot} 0`);
    }
}

function collideWithSolids(player, playerBody) {
    return collideWithBoxes(player, playerBody, "solids");
}

function collideWithHouses(player, playerBody) {
    return collideWithBoxes(player, playerBody, "houses");
}

function collideWithSlows(player, playerBody) {
    return collideWithBoxes(player, playerBody, "slows");
}

function collideWithRoads(player, playerBody) {
    return collideWithBoxes(player, playerBody, "roads");
}

function collideWithPlaces(player, playerBody) {
    return collideWithBoxes(player, playerBody, "places");
}

function collideWithBoxes(player, playerBody, aentity) {
    parent = document.getElementById(aentity);
    for(let i=0; i<parent.children.length; i++) {
        let box = parent.children.item(i);
        if(collideWithBox(player, playerBody, box))
            return box
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

function setupDogAnimation() {
    const player = document.getElementById("player");
    const playerBody = document.getElementById("playerBody");
    const frontLeftLeg = document.getElementById("frontLeftLeg");
    const frontRightLeg = document.getElementById("frontRightLeg");
    const backLeftLeg = document.getElementById("backLeftLeg");
    const backRightLeg = document.getElementById("backRightLeg");
    
    // Orginal position
    const originalBodyY = 0.25;
    const legOriginalY = {
        frontLeftLeg: -0.1,
        frontRightLeg: -0.1,
        backLeftLeg: -0.1,
        backRightLeg: -0.1
    };
    
    document.addEventListener("keydown", (event) => {
        if (event.key in keys) {
            keys[event.key] = true;
            
            // Kolla om den ska börja animera
            if (!isWalking && (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight)) {
                isWalking = true;
                startBounceAnimation();
            }
        }
        if(event.key === ' ')
            isSpacePressed = true;
    });
    
    document.addEventListener("keyup", (event) => {
        if (event.key in keys) {
            keys[event.key] = false;
            
            // Kolla om den ska sluta animera
            if (!(keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight)) {
                isWalking = false;
                stopBounceAnimation();
            }
        }
        if(event.key === ' ')
            isSpacePressed = false;
            isSpaceReleased = true;
    });
    
    function startBounceAnimation() {
        // Stoppa animation
        stopBounceAnimation();
        
        // Påbörja aniamtion
        let goingUp = true;
        let currentY = originalBodyY;
        let step = 0;
        
        bounceTimer = setInterval(() => {
            if (!isWalking) {
                stopBounceAnimation();
                return;
            }
            
            // Body bounce
            if (goingUp) {
                currentY += 0.04;
                if (currentY >= originalBodyY + bounceHeight) {
                    goingUp = false;
                }
            } else {
                currentY -= 0.04;
                if (currentY <= originalBodyY) {
                    goingUp = true;
                }
            }
            
            // Update body position
            playerBody.setAttribute("position", `0 ${currentY} 0`);
            
            // Animate legs
            if (frontLeftLeg && frontRightLeg && backLeftLeg && backRightLeg) {
                if (step % 2 === 0) {
                    // First diagonal pair (front-left and back-right)
                    frontLeftLeg.setAttribute("position", `${frontLeftLeg.getAttribute("position").x} ${legOriginalY.frontLeftLeg + 0.1} ${frontLeftLeg.getAttribute("position").z}`);
                    backRightLeg.setAttribute("position", `${backRightLeg.getAttribute("position").x} ${legOriginalY.backRightLeg + 0.1} ${backRightLeg.getAttribute("position").z}`);
                    
                    // Reset other diagonal pair
                    frontRightLeg.setAttribute("position", `${frontRightLeg.getAttribute("position").x} ${legOriginalY.frontRightLeg} ${frontRightLeg.getAttribute("position").z}`);
                    backLeftLeg.setAttribute("position", `${backLeftLeg.getAttribute("position").x} ${legOriginalY.backLeftLeg} ${backLeftLeg.getAttribute("position").z}`);
                } else {
                    // Second diagonal pair (front-right and back-left)
                    frontRightLeg.setAttribute("position", `${frontRightLeg.getAttribute("position").x} ${legOriginalY.frontRightLeg + 0.1} ${frontRightLeg.getAttribute("position").z}`);
                    backLeftLeg.setAttribute("position", `${backLeftLeg.getAttribute("position").x} ${legOriginalY.backLeftLeg + 0.1} ${backLeftLeg.getAttribute("position").z}`);
                    
                    // Reset first diagonal pair
                    frontLeftLeg.setAttribute("position", `${frontLeftLeg.getAttribute("position").x} ${legOriginalY.frontLeftLeg} ${frontLeftLeg.getAttribute("position").z}`);
                    backRightLeg.setAttribute("position", `${backRightLeg.getAttribute("position").x} ${legOriginalY.backRightLeg} ${backRightLeg.getAttribute("position").z}`);
                }
                
                step++;
            }
        }, bounceSpeed);
    }
    
    function stopBounceAnimation() {
        clearInterval(bounceTimer);
        
        // Reset body position
        playerBody.setAttribute("position", `0 ${originalBodyY} 0`);
        
        // Reset leg positions
        if (frontLeftLeg && frontRightLeg && backLeftLeg && backRightLeg) {
            frontLeftLeg.setAttribute("position", `${frontLeftLeg.getAttribute("position").x} ${legOriginalY.frontLeftLeg} ${frontLeftLeg.getAttribute("position").z}`);
            frontRightLeg.setAttribute("position", `${frontRightLeg.getAttribute("position").x} ${legOriginalY.frontRightLeg} ${frontRightLeg.getAttribute("position").z}`);
            backLeftLeg.setAttribute("position", `${backLeftLeg.getAttribute("position").x} ${legOriginalY.backLeftLeg} ${backLeftLeg.getAttribute("position").z}`);
            backRightLeg.setAttribute("position", `${backRightLeg.getAttribute("position").x} ${legOriginalY.backRightLeg} ${backRightLeg.getAttribute("position").z}`);
        }
    }
}

function spacePressed(house) {
    const outsideHouse = document.getElementById("outsideHouse");
    const insideHouse = document.getElementById("insideHouse");
    if(outsideHouse.getAttribute("visible") == true) {
        isSpaceReleased = false;
        hideSigns();
        insideHouse.setAttribute("visible", "true");
        var housedescription="value:" + house.getAttribute("xtext");
        housedescription+="\n\nDo you want to exit? Press the Space key."
        console.log(house);
        insideHouse.setAttribute("text", housedescription);
        outsideHouse.setAttribute("visible", "false");
        updateHouseProgress(house);
    }
    else if(isSpaceReleased && insideHouse.getAttribute("visible") == true)
        hideSigns(); 
}

//skyltar
function hideSigns() {
    const signs = document.getElementById("signs");
    Array.from(signs.children).forEach(sign => {
        sign.setAttribute("visible", "false");
    });
}

// Progress bar
function setupHouseProgressBar() {
    // Count total houses
    const houses = document.querySelectorAll('.house');
    totalHouses = houses.length;
    
    // Initialize the array to track visited houses
    houseVisited = new Array(totalHouses).fill(false);
    
    // Create progress bar in the UI
    const scene = document.querySelector('a-scene');
    
    // Create container entity
    const progressContainer = document.createElement('a-entity');
    progressContainer.setAttribute('id', 'progressContainer');
    progressContainer.setAttribute('position', '0 2.2 -3'); // Position at top middle, relative to camera
    progressContainer.setAttribute('rotation', '0 0 0');
    progressContainer.setAttribute('scale', '1 1 1');
    
    // Create background for progress bar
    const progressBackground = document.createElement('a-plane');
    progressBackground.setAttribute('color', 'white');
    progressBackground.setAttribute('width', '2');
    progressBackground.setAttribute('height', '0.4');
    progressBackground.setAttribute('opacity', '1');
    progressContainer.appendChild(progressBackground);
    
    // Create the progress bar itself
    const progressBar = document.createElement('a-plane');
    progressBar.setAttribute('id', 'progressBar');
    progressBar.setAttribute('color', 'yellow');
    progressBar.setAttribute('width', '0'); // Start at 0 width
    progressBar.setAttribute('height', '0.3');
    progressBar.setAttribute('position', '-0.6 0 0.01'); // Align left
    progressBar.setAttribute('shader', 'flat');
    progressContainer.appendChild(progressBar);
    
    // Add text to show progress
    const progressText = document.createElement('a-text');
    progressText.setAttribute('id', 'progressText');
    progressText.setAttribute('value', 'Houses: 0/' + totalHouses);
    progressText.setAttribute('color', 'black');
    progressText.setAttribute('align', 'center');
    progressText.setAttribute('position', '0 0 0.02');
    progressText.setAttribute('width', '4');
    progressContainer.appendChild(progressText);
    
    // Add the progress container to the camera
    const camera = document.querySelector('[camera]');
    camera.appendChild(progressContainer);
}

// Add this function to update the progress bar
function updateHouseProgress(house) {
    houseId = house.getAttribute("data-house-id");
    console.log(houseId);
    if (!houseVisited[houseId]) {
        houseVisited[houseId] = true;
        visitedHouses++;
        
        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        // Calculate width based on progress (1.2 is full width from background)
        const progressWidth = (visitedHouses / totalHouses) * 1.2;
        
        // Update progress bar width and position
        progressBar.setAttribute('width', progressWidth);
        progressBar.setAttribute('position', (-0.6 + progressWidth/2) + ' 0 0.01');
        
        // Update text
        progressText.setAttribute('value', 'Houses: ' + visitedHouses + '/' + totalHouses);
        
        // Add celebration effect when all houses are visited
        if (visitedHouses === totalHouses) {
            showCompletionMessage();
        }
    }
}

// Add this function to show a completion message
function showCompletionMessage() {
    // Create a congratulation message
    const scene = document.querySelector('a-scene');
    const message = document.createElement('a-entity');
    message.setAttribute('id', 'completionMessage');
    message.setAttribute('position', '0 1.5 -2');
    message.setAttribute('text', {
        value: 'Congratulations!\nYou visited all houses!',
        color: 'black',
        align: 'center',
        width: 5,
        wrapCount: 25
    });
    
    // Add background for better visibility
    const msgBackground = document.createElement('a-plane');
    msgBackground.setAttribute('color', 'white');
    msgBackground.setAttribute('width', '2.5');
    msgBackground.setAttribute('height', '0.8');
    msgBackground.setAttribute('opacity', '1');
    msgBackground.setAttribute('position', '0 0 -0.01');
    message.appendChild(msgBackground);
    
    // Add to scene
    scene.appendChild(message);
    
    // Remove after 5 seconds
    setTimeout(() => {
        scene.removeChild(message);
    }, 5000);
}
