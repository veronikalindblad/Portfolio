//Gesällprov Veronika Lindblad (c) 2025

var coinCount = 0;              // Antalet samlade mynt
var totalHouses = 0;            // Antalet hus
var visitedHouses = 0;          // Antalet besökta hus
var houseVisited = {};          // Vilka hus som besökts
var activeHouse = null;         // Senaste hus som hunden kolliderat med
var isSpacePressed = false;     // Om Space tangenten är nedtryckt
var isSpaceReleased = false;    // Om Space tangenten är upsläppt efter att ha varit nedtryckt
var inSlow = false;             // Om hunden är i en slow
var inLake = false;             // Om hunden är i en sjö
var isWalking = false;          // Om hunden går
var bounceTimer = null;         // Timer som hjälper hundens gå animation 
var bounceHeight = 0.08;        // Gå animationens höjd
var bounceSpeed = 150;          // Gå animationens hastighet (i millisekunder)
var rot = 0;                    // Myntens rotationsvinkel
const keys = {                  // Vilka piltangenter som är nedtryckta
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Ljud
const lakesound = new Audio("../media/lake.wav");
const coinsound = new Audio("../media/coin.wav");
const slowssound = new Audio("../media/slows.wav");
const placessound = new Audio("../media/places.wav");

// Köra när hela dokumentet och A-Frame är redo
document.addEventListener("DOMContentLoaded", () => {
      
      // Generera slumpmässig siffra
      function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      
      // Generera slumpmässig grå
      function randomGrayShade() {
        const shade = randomInt(100, 200).toString(16);
        return `#${shade}${shade}${shade}`;
      }
      
      // Hämta alla hus
      const houses = document.querySelectorAll('.house');
      
      // För varje hus sätts en slumpmässig grå färg
      houses.forEach(house => {
        const grayShade = randomGrayShade();
        house.setAttribute('color', grayShade);   
      });
    
    // Hämta hunden med kamera
    const playerBody = document.getElementById("playerBody");

    // Hantera hundens startposition och hastighet
    let playerX = 0, playerZ = -5;
    const speed = 0.06;

    // Registrera vilka knappar som trycks och släpps
    document.addEventListener("keydown", (event) => {
        if (event.key in keys) keys[event.key] = true;
    });

    document.addEventListener("keyup", (event) => {
        if (event.key in keys) keys[event.key] = false;
    });

    // Uptadera animering av innehållet
    function update() {
        const player = document.getElementById("player");
        playerX = player.getAttribute("position").x;
        playerZ = player.getAttribute("position").z;
        playerR = player.getAttribute("rotation").y;
        oldPlayerX = playerX;
        oldPlayerZ = playerZ;
        // Hur hunden rör sig beroende på kamerans vinkel 
        vx = speed * Math.sin(playerR/57.296);
        vz = speed * Math.cos(playerR/57.296);
        
        // Vad som händer när hunden är i en slow
        if(collideWithSlows(player, playerBody)) {
            vx /= 2;
            vz /= 2;
            if(!inSlow)
                slowssound.play();
            inSlow = true;
        } else inSlow = false;
        
         // Vad som händer när hunden är i en sjö
        if(collideWithLake(player, playerBody)) {
            vx /= 2;
            vz /= 2;
            if(!inLake)
                lakesound.play();
            inLake = true;
        } else inLake = false;

         // Vad som händer när hunden är på en väg
        if(collideWithRoads(player, playerBody)) {
            vx *= 1.3;
            vz *= 1.3;
        }

         // Vad som händer när hunden är i ett nytt område
        const place = collideWithPlaces(player, playerBody);
        if(place) {
            const info = document.getElementById(place.id + "Info");
            if (info && info.getAttribute("visible") == false) {
                placessound.play();
                hideSigns();
                info.setAttribute("visible", "true");
                var signTimer = setTimeout(() => {
                    // Ta bort skylten för alltid efter den visats första gången
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

        // Översätta pilknapptryckningar till hundens rörelse
        if (keys.ArrowUp)    { playerX -= vx; playerZ -= vz; }
        if (keys.ArrowDown)  { playerX += vx; playerZ += vz; }
        if (keys.ArrowLeft)  { playerX -= vz; playerZ += vx; }
        if (keys.ArrowRight) { playerX += vz; playerZ -= vx; }

        //Stoppa hunden från att gå ut från gräsmattan
        if (playerX < -23) playerX = -23;
        if (playerX >  23) playerX =  23;
        if (playerZ < -23) playerZ = -23;
        if (playerZ >  23) playerZ =  23;

        // Uppdatera hundens position
        // Hunden backas senare tillbaka om den krockar med en solid
        player.setAttribute("position", `${playerX} 0 ${playerZ}`);
        // Uppdatera hundens rotation beroende på pilknapptryckningar
        // Kan känna av flera pilknapptryckningar samtidigt
        // -1 betyder en omöjlig kombination och då roteras inte hunden
        const playerAngles = {
            true: { // Upp
                true: { // Upp + ner
                    true: { true: -1, false: -1 },
                    false: { true: -1, false: -1 }
                },
                false: { // Upp + inte ner
                    true: { true: -1, false: 225 }, // Upp och vänster
                    false: { true: 135, false: 180 } // Upp och höger, bara upp
                }
            },
            false: { // Inte upp
                true: { // Inte upp + ner
                    true: { true: -1, false: 315 }, // Ner + vänster
                    false: { true: 45, false: 0 } // Ner + höger, bara ner
                },
                false: { // Inte upp + inte ner
                    true: { true: -1, false: 270 }, // Bara vänster
                    false: { true: 90, false: -2 } // Bara höger
                }
            },
        }

        // Kolla upp hundens vinkel från info ovan
        playerRot = playerAngles[keys.ArrowUp][keys.ArrowDown][keys.ArrowLeft][keys.ArrowRight];
        if (playerRot >= 0)
            // Sätter hundens rotation om vinkeln inte är negativ
            playerBody.setAttribute("rotation", `0 ${playerRot} 0`);

        // Kollar om hunden kolliderar med ett hus eller en solid
        // Då flyttas hunden tillbaka där den var innan
        const houseCollision = collideWithHouses(player, playerBody);
        if(houseCollision || collideWithSolids(player, playerBody))
            player.setAttribute("position", `${oldPlayerX} 0 ${oldPlayerZ}`);

        // Om hunden kolliderar med ett hus visas infoskylten för utanför huset
        // Kollisionsljudet spelas upp
        if(houseCollision) {
            activeHouse = houseCollision;
            const outsideHouse = document.getElementById("outsideHouse");
            if (outsideHouse && outsideHouse.getAttribute("visible") == false) {
                placessound.play();
                hideSigns();
                outsideHouse.setAttribute("visible", "true");
                // Skylten tas bort efter 5 sekunder och huset är inte längre aktivt
                var signTimer = setTimeout(() => {
                    outsideHouse.setAttribute("visible", "false");
                    activeHouse = null;
                    return;
                    }, 
                    5000
                );    
            }    
        }    

        // Hunden går in i huset om man tryckt på mellanslag när skylten visas
        if(isSpacePressed) {
            spacePressed(activeHouse);
        }

        // Hunden går ut ur huset om man trycker på mellanslag igen
        if(player.getAttribute("position").x != oldPlayerX || player.getAttribute("position").z != oldPlayerZ) {
            outsideHouse.setAttribute("visible", "false");
        }

        // Om hunden kolliderar med ett mynt så samlas det in och läggs till i mynt räknaren
        // Kollisionsljudet spelas upp
        theCoin = collideWithCoins(player, playerBody);
        if (theCoin) {
            coins = document.getElementById("coins");
            coins.removeChild(theCoin);
            coinCount += 1; 
            const coinCounter = document.getElementById("coinCounter");
            coinCounter.setAttribute('text', 'value', coinCount);
            coinsound.play();
        }

        // Informationsskylten som visas i början försvinner när man trycket på piltangenterna 
        const infoBox = document.getElementById("infoBox");
        if(playerX != oldPlayerX || playerZ != oldPlayerZ)
            infoBox.setAttribute("visible", "false");
        
        // Rotera mynt
        rotateCoins();
        
        // Fortsätta animationer
        requestAnimationFrame(update);
    }

    // Ladda progressbar för hus
    setupHouseProgressBar();

    // Starta animation av hunden 
    setupDogAnimation();

    // Starta animationen av staden
    update();
});

// Rotera mynt
function rotateCoins() {
    coins = document.getElementById("coins");
    rot += 2;
    for(let i=0; i<coins.children.length; i++) {
        let coin = coins.children.item(i);
        coin.setAttribute("rotation", `90 ${rot} 0`);
    }
}

// Ta reda på om hunden kolliderar med olika typer av objekt
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

// Beräkna kollision med flera rätblock
function collideWithBoxes(player, playerBody, aentity) {
    parent = document.getElementById(aentity);
    for(let i=0; i<parent.children.length; i++) {
        let box = parent.children.item(i);
        if(collideWithBox(player, playerBody, box))
            return box;
    }
    return null;  // Ingen kollision
}

// Beräkna kollision med ett rätblock
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

// Beräkna kollision med flera mynt
function collideWithCoins(player, playerBody) {
    coins = document.getElementById("coins");
    for(let i=0; i<coins.children.length; i++) {
        let coin = coins.children.item(i);
        if(collideWithSphere(player, playerBody, coin))
            return coin;
    }
    return null;
}

// Beräkna kollision med en sfär
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

// Beräkna kollision med sjö
function collideWithLake(player, playerBody) {
    const lake = document.getElementById("lake");
    if (lake && collideWithCircle(player, playerBody, lake)) {
        return lake;
    }
    return null;
}

// Beräkna kollision med en cirkel
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

// Startar hund animationer vid gång
function setupDogAnimation() {
    const player = document.getElementById("player");
    const playerBody = document.getElementById("playerBody");
    const frontLeftLeg = document.getElementById("frontLeftLeg");
    const frontRightLeg = document.getElementById("frontRightLeg");
    const backLeftLeg = document.getElementById("backLeftLeg");
    const backRightLeg = document.getElementById("backRightLeg");
    
    // Ursprunglig position
    const originalBodyY = 0.25;
    const legOriginalY = {
        frontLeftLeg: -0.1,
        frontRightLeg: -0.1,
        backLeftLeg: -0.1,
        backRightLeg: -0.1
    };
    
    // Lyssna efter pilknapptryckningar
    document.addEventListener("keydown", (event) => {
        if (event.key in keys) {
            keys[event.key] = true;
            
            // Kolla om den ska börja animera
            if (!isWalking && (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight)) {
                isWalking = true;
                startBounceAnimation();
            }
        }
        
        // Kolla om Space tangenten är nedtryckt
        if(event.key === ' ')
            isSpacePressed = true;
    });
    
    // Kolla vilken knapp som släppts upp
    document.addEventListener("keyup", (event) => {
        if (event.key in keys) {
            keys[event.key] = false;
            
            // Kolla om den ska sluta animera
            if (!(keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight)) {
                isWalking = false;
                stopBounceAnimation();
            }
        }
        // Kolla om Space har släpps upp
        if(event.key === ' ')
            isSpacePressed = false;
            isSpaceReleased = true;
    });
    
    // Starta hundens gång animation
    function startBounceAnimation() {
        // Stoppa animation
        stopBounceAnimation();
        
        let goingUp = true;
        let currentY = originalBodyY;
        let step = 0;
        
        bounceTimer = setInterval(() => {
            if (!isWalking) {
                stopBounceAnimation();
                return;
            }
            
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
            
            // Uppdatera hundens höjd
            playerBody.setAttribute("position", `0 ${currentY} 0`);
            
            // Animera hudens ben
            if (frontLeftLeg && frontRightLeg && backLeftLeg && backRightLeg) {
                if (step % 2 === 0) {
                    // Första diagonella par (vänster fram och höger bak)
                    frontLeftLeg.setAttribute("position", `${frontLeftLeg.getAttribute("position").x} ${legOriginalY.frontLeftLeg + 0.1} ${frontLeftLeg.getAttribute("position").z}`);
                    backRightLeg.setAttribute("position", `${backRightLeg.getAttribute("position").x} ${legOriginalY.backRightLeg + 0.1} ${backRightLeg.getAttribute("position").z}`);
                    
                    // Återställa det andra diagonella paret
                    frontRightLeg.setAttribute("position", `${frontRightLeg.getAttribute("position").x} ${legOriginalY.frontRightLeg} ${frontRightLeg.getAttribute("position").z}`);
                    backLeftLeg.setAttribute("position", `${backLeftLeg.getAttribute("position").x} ${legOriginalY.backLeftLeg} ${backLeftLeg.getAttribute("position").z}`);
                } else {
                    // Andra diagonella paret (höger fram och vänster bak)
                    frontRightLeg.setAttribute("position", `${frontRightLeg.getAttribute("position").x} ${legOriginalY.frontRightLeg + 0.1} ${frontRightLeg.getAttribute("position").z}`);
                    backLeftLeg.setAttribute("position", `${backLeftLeg.getAttribute("position").x} ${legOriginalY.backLeftLeg + 0.1} ${backLeftLeg.getAttribute("position").z}`);
                    
                    // Återställa det ursprungliga diagonella paret
                    frontLeftLeg.setAttribute("position", `${frontLeftLeg.getAttribute("position").x} ${legOriginalY.frontLeftLeg} ${frontLeftLeg.getAttribute("position").z}`);
                    backRightLeg.setAttribute("position", `${backRightLeg.getAttribute("position").x} ${legOriginalY.backRightLeg} ${backRightLeg.getAttribute("position").z}`);
                }
                
                step++;
            }
        }, bounceSpeed);
    }
    
    // Stoppa hundens gång animation
    function stopBounceAnimation() {
        clearInterval(bounceTimer);
        
        // Återställa hundens kropp
        playerBody.setAttribute("position", `0 ${originalBodyY} 0`);
        
        // Återställa hudens ben
        if (frontLeftLeg && frontRightLeg && backLeftLeg && backRightLeg) {
            frontLeftLeg.setAttribute("position", `${frontLeftLeg.getAttribute("position").x} ${legOriginalY.frontLeftLeg} ${frontLeftLeg.getAttribute("position").z}`);
            frontRightLeg.setAttribute("position", `${frontRightLeg.getAttribute("position").x} ${legOriginalY.frontRightLeg} ${frontRightLeg.getAttribute("position").z}`);
            backLeftLeg.setAttribute("position", `${backLeftLeg.getAttribute("position").x} ${legOriginalY.backLeftLeg} ${backLeftLeg.getAttribute("position").z}`);
            backRightLeg.setAttribute("position", `${backRightLeg.getAttribute("position").x} ${legOriginalY.backRightLeg} ${backRightLeg.getAttribute("position").z}`);
        }
    }
}

// Göra att man går in och ut ur hus när Space knappen är nedtryckt 
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

// Göra att alla andra skyltar döljs om en skylt visas
function hideSigns() {
    const signs = document.getElementById("signs");
    Array.from(signs.children).forEach(sign => {
        sign.setAttribute("visible", "false");
    });
}

// Skapa en progress bar över husbesök
function setupHouseProgressBar() {
    // Räkna antalet hus
    const houses = document.querySelectorAll('.house');
    totalHouses = houses.length;
    
    // Skapa array för att räkna hus
    houseVisited = new Array(totalHouses).fill(false);
    
    // Skapa progress bar
    const scene = document.querySelector('a-scene');
    
    // Skapar progress bar objektet
    const progressContainer = document.createElement('a-entity');
    progressContainer.setAttribute('id', 'progressContainer');
    progressContainer.setAttribute('position', '0 2.2 -3');
    progressContainer.setAttribute('rotation', '0 0 0');
    progressContainer.setAttribute('scale', '1 1 1');
    
    // Skapa bakgrunden i progress baren
    const progressBackground = document.createElement('a-plane');
    progressBackground.setAttribute('color', 'white');
    progressBackground.setAttribute('width', '2');
    progressBackground.setAttribute('height', '0.4');
    progressBackground.setAttribute('opacity', '1');
    progressContainer.appendChild(progressBackground);
    
    // Skapa progress bar strecket
    const progressBar = document.createElement('a-plane');
    progressBar.setAttribute('id', 'progressBar');
    progressBar.setAttribute('color', 'yellow');
    progressBar.setAttribute('width', '0');
    progressBar.setAttribute('height', '0.3');
    progressBar.setAttribute('position', '-0.6 0 0.01');
    progressBar.setAttribute('shader', 'flat');
    progressContainer.appendChild(progressBar);
    
    // Skapa text i progress baren över besökta hus
    const progressText = document.createElement('a-text');
    progressText.setAttribute('id', 'progressText');
    progressText.setAttribute('value', 'Houses: 0/' + totalHouses);
    progressText.setAttribute('color', 'black');
    progressText.setAttribute('align', 'center');
    progressText.setAttribute('position', '0 0 0.02');
    progressText.setAttribute('width', '4');
    progressContainer.appendChild(progressText);
    
    // Lägga till progress baren i kameran
    const camera = document.querySelector('[camera]');
    camera.appendChild(progressContainer);
}

// Uppdatera progress baren och anger vilket hus som besökts
function updateHouseProgress(house) {
    houseId = house.getAttribute("data-house-id");
    console.log(houseId);
    if (!houseVisited[houseId]) {
        houseVisited[houseId] = true;
        visitedHouses++;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        // Räknar ut hur långt progress bar strecket ska vara
        const progressWidth = (visitedHouses / totalHouses) * 1.2;
        
        // Uppdatera längden av progress bar strecket
        progressBar.setAttribute('width', progressWidth);
        progressBar.setAttribute('position', (-0.6 + progressWidth/2) + ' 0 0.01');
        
        // Updatera texten i progress baren
        progressText.setAttribute('value', 'Houses: ' + visitedHouses + '/' + totalHouses);
    }
}
