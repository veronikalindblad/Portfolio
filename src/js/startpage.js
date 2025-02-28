
const cloudConfig = {
    minSize: 50,        // Min storlek
    maxSize: 200,       // Max storlek
    minSpeed: 20,       // Min hastighet
    maxSpeed: 60,       // Max hastighet
    spawnInterval: 3000, // Nytt moln varje 3 sek
    maxClouds: 5,      // Max antal moln som syns
};

// Håller koll på moln
let activeClouds = [];
let poofSound = new Audio('../media/poof.wav');

// Startmoln
window.addEventListener('load', () => {
    // Börja spawna moln
    const intervalId = setInterval(createCloud, cloudConfig.spawnInterval);
    
    // Moln som finns från början
    for (let i = 0; i < 3; i++) {
        createCloud(true);
    }
    
    // Animations loop
    requestAnimationFrame(updateClouds);
});

// Skapa moln
function createCloud(initial=false) {
    // Skapa inte fler moln om det är vid max
    if (activeClouds.length >= cloudConfig.maxClouds) {
        return;
    }
    
    // Skapa moln i DOM
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    
    // Randomiserar moln
    var sizeX = Math.random() * (cloudConfig.maxSize - cloudConfig.minSize) + cloudConfig.minSize;
    var sizeY = Math.random() * (cloudConfig.maxSize - cloudConfig.minSize) + cloudConfig.minSize;
    if (sizeX < sizeY) {
        sizeT = sizeX;
        sizeX = sizeY;
        sizeY = sizeT;
    }
    const speed = Math.random() * (cloudConfig.maxSpeed - cloudConfig.minSpeed) + cloudConfig.minSpeed;
    
    // Gör att molnen börjar
    const yPosition = Math.random() * (window.innerHeight - sizeY);
    const xPosition = Math.random() * (window.innerWidth);
    
    // Moln utseende
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
    
    document.body.appendChild(cloud);
    
    // Kommer ihåg molninfo för animation
    var position = window.innerWidth;
    if (initial) position = xPosition;
    activeClouds.push({
        element: cloud,
        speed: speed,
        position: position
    });
}

// Uppdaterar alla molns position
function updateClouds(timestamp) {
    if (!updateClouds.lastTimestamp) {
        updateClouds.lastTimestamp = timestamp;
    }
    const deltaTime = (timestamp - updateClouds.lastTimestamp) / 1000; // in seconds
    updateClouds.lastTimestamp = timestamp;
    
    // Uppdaterar ett molns position
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
    
    // Fortsätter animationen
    requestAnimationFrame(updateClouds);
}