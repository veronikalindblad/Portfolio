function redirectToCity() {
    window.location.href = "../html/city.html";
}

var coinCount = 0;
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
            slowssound.play();
        }
        
        if(collideWithLake(player, playerBody)) {
            vx /= 2;
            vz /= 2;
            lakesound.play();
        }

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
                    info.parentNode.removeChild(info);
                    place.parentNode.removeChild(place);    
                    return;
                    }, 
                    5000
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
            const outsideHouse = document.getElementById("outsideHouse");
            if (outsideHouse && outsideHouse.getAttribute("visible") == false) {
                placessound.play();
                hideSigns();
                outsideHouse.setAttribute("visible", "true");
                var signTimer = setTimeout(() => {
                    outsideHouse.setAttribute("visible", "false");    
                    return;
                    }, 
                    5000
                );    
            }    
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
            spacePressed();
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
    });
    
    function spacePressed() {
        const outsideHouse = document.getElementById("outsideHouse");
        const insideHouse = document.getElementById("insideHouse");
        if(outsideHouse.getAttribute("visible") == true) {
            hideSigns();
            insideHouse.setAttribute("visible", "true");
            outsideHouse.setAttribute("visible", "false");
        }
        else if(insideHouse.getAttribute("visible") == true)
            hideSigns(); 
    }

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

//skyltar
function hideSigns() {
    const signs = document.getElementById("signs");
    console.log(signs.children);
    Array.from(signs.children).forEach(sign => {
        sign.setAttribute("visible", "false");
    });
}