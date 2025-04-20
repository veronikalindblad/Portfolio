//Gesällprov Veronika Lindblad (c) 2025

const cloudConfig = {
    minSize: 50,        // Min storlek
    maxSize: 200,       // Max storlek
    minSpeed: 20,       // Min hastighet
    maxSpeed: 60,       // Max hastighet
    spawnInterval: 3000, // Nytt moln varje 3 sek
    maxClouds: 5,      // Max antal moln som syns
};

// Lista på moln
let activeClouds = [];

// Ljud för moln som poofar
let poofSound = new Audio('../media/poof.wav');

// Startmoln
window.addEventListener('load', () => {
    // Starta timer för att spawna moln
    const intervalId = setInterval(createCloud, cloudConfig.spawnInterval);
    
    // Moln som finns från början
    for (let i = 0; i < 3; i++) {
        // Spawna moln på skärmen
        createCloud(true);
    }
    
    // Flytta molnen loop
    requestAnimationFrame(updateClouds);
});

// Skapa ett moln
// Om initial är false spawnas moln utanför skärmen
function createCloud(initial=false) {
    // Skapa inte fler moln om det är vid max
    if (activeClouds.length >= cloudConfig.maxClouds) {
        return;
    }
    
    // Skapa moln i DOM
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    
    // Randomisera molnstorlek
    var sizeX = Math.random() * (cloudConfig.maxSize - cloudConfig.minSize) + cloudConfig.minSize;
    var sizeY = Math.random() * (cloudConfig.maxSize - cloudConfig.minSize) + cloudConfig.minSize;
    // Om molnet är högre än det är brett byts x och y storleken
    if (sizeX < sizeY) {
        sizeT = sizeX;
        sizeX = sizeY;
        sizeY = sizeT;
    }
    // Hastighet på moln
    const speed = Math.random() * (cloudConfig.maxSpeed - cloudConfig.minSpeed) + cloudConfig.minSpeed;
    
    // Gör att alla moln börjar inne på skärmen
    // Molnen flyttas senare utanför skärmen om de inte är startmoln
    const yPosition = Math.random() * (window.innerHeight - sizeY);
    const xPosition = Math.random() * (window.innerWidth);
    
    // Moln utseende och placering
    cloud.style.width = `${sizeX}px`;
    cloud.style.height = `${sizeY}px`;
    cloud.style.left = `${xPosition}px`;
    cloud.style.top = `${yPosition}px`;
    
    // Lyssnar efter click för poof händelse
    cloud.addEventListener('click', () => {
        // Spelar poof ljud
        poofSound.currentTime = 0;
        poofSound.play();
        
        // Lägger till synlig poof effekt
        cloud.style.opacity = "0";
        
        // Filtrerar bort moln som inte längre finns kvar i DOM
        setTimeout(() => {
            document.body.removeChild(cloud);
            activeClouds = activeClouds.filter(c => c.element !== cloud);
        }, 300);
    });
    
    // Lägga till moln i DOM
    document.body.appendChild(cloud);
    
    // Lägga till moln i aktiva moln listan
    // Moln som inte är startmoln flyttas utanför skärmen
    var position = window.innerWidth;
    if (initial) position = xPosition;
    activeClouds.push({
        element: cloud,
        speed: speed,
        position: position
    });
}

// Uppdatera alla molns position
function updateClouds(timestamp) {
    if (!updateClouds.lastTimestamp) {
        updateClouds.lastTimestamp = timestamp;
    }
    const deltaTime = (timestamp - updateClouds.lastTimestamp) / 1000;
    updateClouds.lastTimestamp = timestamp;
    
    // Uppdatera ett molns position
    activeClouds.forEach((cloud, index) => {
        // Move the cloud based on its speed
        cloud.position -= cloud.speed * deltaTime;
        cloud.element.style.left = `${cloud.position}px`;
        
        // Tar bort moln man inte längre ser
        if (cloud.position < -parseFloat(cloud.element.style.width)) {
            document.body.removeChild(cloud.element);
            activeClouds.splice(index, 1);
        }
    });
    
    // Fortsätta flytta moln
    requestAnimationFrame(updateClouds);
}