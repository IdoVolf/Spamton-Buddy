// == CONFIG ==

const style = document.createElement('style'); 
style.textContent = `
  img {
    image-rendering: pixelated !important;
    image-rendering: crisp-edges !important;
  }
`;
document.head.appendChild(style);


// Idle frames
let frames = [];
for (let i = 1; i <= 4; i++) {
  frames.push(chrome.runtime.getURL(`assets/idle/idle${i}.png`));
}
let idleImages = [];
frames.forEach(src => {
  const img = new Image();
  img.src = src;
  idleImages.push(img);
});

//fly frames
let flyFrames = [];
for (let i = 1; i <= 2; i++) {
  const img = new Image();
  img.src = chrome.runtime.getURL(`assets/fly/fly${i}.png`);
  flyFrames.push(img);
}

// laugh frames
let laughFrames = [];
for (let i =1; i <=3; i++){
  const img = new Image();
  img.src = chrome.runtime.getURL(`assets/laugh/laugh${i}.png`);
  laughFrames.push(img);
}

// Dance1 preload
const totalDance1Frames = 16;
let dance1Images = [];

function preloadDance1Frames() {
  return new Promise((resolve) => {
    let loaded = 0;
    for (let i = 1; i <= totalDance1Frames; i++) {
      const img = new Image();
      img.src = chrome.runtime.getURL(`assets/dance1/1dance${i}.png`);
      img.onload = () => {
        loaded++;
        if (loaded === totalDance1Frames) resolve();
      };
      img.onerror = () => console.warn(`Failed to load dance1 frame ${i}`);
      dance1Images.push(img);
    }
  });
}

// Dance2 preload
const totalDance2Frames = 8;
let dance2Images = [];

function preloadDance2Frames() {
  return new Promise((resolve) => {
    let loaded = 0;
    for (let i = 1; i <= totalDance2Frames; i++) {
      const img = new Image();
      img.src = chrome.runtime.getURL(`assets/dance2/2dance${i}.png`);
      img.onload = () => {
        loaded++;
        if (loaded === totalDance2Frames) resolve();
      };
      img.onerror = () => console.warn(`Failed to load dance2 frame ${i}`);
      dance2Images.push(img);
    }
  });
}

// Dance3 preload
const totalDance3Frames = 9;
let dance3Images = [];

function preloadDance3Frames() {
  return new Promise((resolve) => {
    let loaded = 0;
    for (let i = 1; i <= totalDance3Frames; i++) {
      const img = new Image();
      img.src = chrome.runtime.getURL(`assets/glitch/glitch${i}_pixian_ai.png`);
      img.onload = () => {
        loaded++;
        if (loaded === totalDance3Frames) resolve();
      };
      img.onerror = () => console.warn(`Failed to load dance3 frame ${i}`);
      dance3Images.push(img);
    }
  });
}


// Load voice lines as Audio objects
let voiceLines = [];
for (let i = 1; i <= 8; i++) {
  const audio = new Audio(chrome.runtime.getURL(`assets/lines/line${i}.mp3`));
  voiceLines.push(audio);
}

// roasted gif
const roastedGifUrl = chrome.runtime.getURL("assets/spam_roast.gif");
let isRoasted = false;


// == SETUP ==
const spamton = document.createElement("img");
spamton.style.position = "fixed";
spamton.style.left = "0px";
spamton.style.top = "0px";
spamton.style.zIndex = "9999";
spamton.style.width = "100px";
spamton.src = idleImages[0].src;
spamton.style.transition = "transform 0.3s ease";
spamton.style.transformOrigin = "center center"; // scale from center

document.body.appendChild(spamton);
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

spamton.style.cursor = "grab";


//fly vars
let flyFrame = 0;
let lastFlyFrameTime = 0;
const flyFrameDelay = 100; // Change fly frame every 100ms
let flyInterval = null;
let isInSpecialState = false;
const flySound = new Audio(chrome.runtime.getURL("assets/flySound.mp3"));
flySound.loop = true;

// laugh vars
let laughFrame = 0;
let lastLaughFrame = 0;
const laughFrameDelay = 100;
let lasughInterval = null;
let isLaughState = false;

//fire SE
const fireSound = new Audio(chrome.runtime.getURL("assets/fireSE.mp3"));
fireSound.loop =true;

//theme
const spamTheme = new Audio(chrome.runtime.getURL("assets/theme.mp3"));
spamTheme.loop = true;

let dancing = false

spamton.addEventListener("mousedown", (e) => {
  if(isRoasted){
    return 
  }
  isDragging = true;
  isInSpecialState = true;

  dragOffsetX = e.clientX - spamton.offsetLeft;
  dragOffsetY = e.clientY - spamton.offsetTop;
  spamTheme.pause()
  spamton.style.cursor = "grabbing";
  if (flySound.paused) {
    flySound.play().catch(err => {
      // Sometimes browser blocks autoplay without interaction, catch errors silently
      console.log("Fly sound play blocked or error:", err);
    });
  }
  // Start fly animation
  if (!flyInterval) {
    flyFrame = 0;
    flyInterval = setInterval(() => {
      flyFrame = (flyFrame + 1) % flyFrames.length;
      spamton.src = flyFrames[flyFrame].src;
    }, flyFrameDelay);
  }
});


window.addEventListener("mousemove", (e) => {
    if(isRoasted){
    return 
  }
  if (!isDragging) return;

  // Move Spamton
  spamton.style.left = `${e.clientX - dragOffsetX}px`;
  spamton.style.top = `${e.clientY - dragOffsetY}px`;

  // Animate drag
  const now = Date.now();
  if (now - lastFlyFrameTime > flyFrameDelay) {
    flyFrame = (flyFrame + 1) % flyFrames.length;
    spamton.src = flyFrames[flyFrame].src;
    lastFlyFrameTime = now;
  }
});

window.addEventListener("mouseup", () => {
    if(isRoasted){
    return 
  }
  spamTheme.play()
  if (!isDragging) return;
  isDragging = false;
  isInSpecialState = false;
  flySound.pause();
  flySound.currentTime = 0;
  clearInterval(flyInterval);
  flyInterval = null;

  spamton.style.cursor = "grab";
});



spamton.addEventListener("wheel", (e) => {
  if(spamTheme.paused){
    spamTheme.play()
  }else{
    spamTheme.pause()
  }
  if(fireSound.paused){
        fireSound.play();
  }else{
    fireSound.pause()
  }
  e.preventDefault(); // no page scroll

  isRoasted = !isRoasted;

  if (isRoasted) {
    spamton.style.transform = "scale(2.5)";
    // Stop other animations & show gif
    clearInterval(mainAnimationInterval);
    if (flyInterval) {
      clearInterval(flyInterval);
      flyInterval = null;
    }
    spamton.src = roastedGifUrl;
  } else {
    spamton.style.transform = "scale(1)"
    // Resume normal animations
    startAnimation();
  }
});


// Function to play a random voice line
function playRandomVoice() {
  const randomIndex = Math.floor(Math.random() * voiceLines.length);
  voiceLines[randomIndex].play();
}

// Play on click
spamton.addEventListener("click", () => {
  if(isRoasted){
    return
  }
  playRandomVoice();

  if (!isLaughState) {
    isLaughState = true;
    laughFrame = 0;

    // Stop any idle/dance during laugh
    let laughCount = 0;
    const totalLaughLoops = 2; // how many full loops of laughFrames before stopping

    laughInterval = setInterval(() => {
      spamton.src = laughFrames[laughFrame].src;
      laughFrame = (laughFrame + 1) % laughFrames.length;

      if (laughFrame === 0) {
        laughCount++;
        if (laughCount >= totalLaughLoops) {
          clearInterval(laughInterval);
          laughInterval = null;
          isLaughState = false;
        }
      }
    }, laughFrameDelay);
  }
});

// Dance state variables
let shouldDance = false;
let currentDanceImages = null;
let frame = 0;
const frameDelay = 150;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



// Decide if dancing every 8 seconds
function ifDance(callback) {
  if (dancing) {
    // If already dancing, schedule to check again soon
    setTimeout(() => ifDance(callback), 18000);
    return;
  }
  
  // Decide whether to dance (say 60% chance)
  const willDance = Math.random() > 0.4;
  callback(willDance);
  
  // Schedule next check in 8 seconds regardless
  setTimeout(() => ifDance(callback), 18000);
}
const dances = [dance1Images, dance2Images, dance3Images];

function startDanceTimer() {
  ifDance((choice) => {
    if (choice) {
      dancing = true;
      const rand = getRandomInt(0, 2);
      currentDanceImages = dances[rand];
      frame = 0;
      shouldDance = true;
    } else {
      shouldDance = false;
      dancing = false;
    }
  });
}

let mainAnimationInterval = null;

function startAnimation() {
  // Clear existing interval to avoid duplicates
  if (mainAnimationInterval) clearInterval(mainAnimationInterval);

  startDanceTimer();

  mainAnimationInterval = setInterval(() => {
    if (isDragging || isInSpecialState || isLaughState || isRoasted) {
      // Skip idle/dance animation if any special state active
      return;
    }

    if (shouldDance && currentDanceImages) {
      frame++;
      if (frame >= currentDanceImages.length) {
        shouldDance = false;
        frame = 0;
        spamton.src = idleImages[0].src;
      } else {
        spamton.src = currentDanceImages[frame].src;
      }
    } else {
      frame = (frame + 1) % idleImages.length;
      spamton.src = idleImages[frame].src;
      dancing =false;
    }
  }, frameDelay);
}

// wheel event toggle roasting GIF
spamton.addEventListener("auxclick", (e) => {
  if (e.button !== 1) return; // Only middle mouse

  e.preventDefault(); // Important to stop default scroll/auto-open

  isRoasted = !isRoasted;

  if (isRoasted) {
    // Stop all animation
    clearInterval(mainAnimationInterval);
    if (flyInterval) {
      clearInterval(flyInterval);
      flyInterval = null;
    }

    isDragging = false;
    spamton.style.cursor = "default";
    spamton.src = roastedGifUrl;

    // Enlarge Spamton
    spamton.style.transform = "scale(2.5)"; // or spamton.style.width = '250px'
  } else {
    spamton.style.cursor = "grab";

    spamton.style.transform = "scale(1)"; // back to normal
    spamton.src = idleImages[0].src;
    startAnimation();
  }
});


// Kick off loading and animation
Promise.all([
  preloadDance1Frames(),
  preloadDance2Frames(),
  preloadDance3Frames()
]).then(() => {
  console.log("All frames loaded! Starting animation...");
  startAnimation();
  spamTheme.play();
});
