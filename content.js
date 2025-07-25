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

// Load voice lines as Audio objects
let voiceLines = [];
for (let i = 1; i <= 3; i++) {
  const audio = new Audio(chrome.runtime.getURL(`assets/lines/line${i}.mp3`));
  voiceLines.push(audio);
}


// == SETUP ==
const spamton = document.createElement("img");
spamton.style.position = "fixed";
spamton.style.left = "0px";
spamton.style.top = "0px";
spamton.style.zIndex = "9999";
spamton.style.width = "100px";
spamton.src = idleImages[0].src;
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

spamton.addEventListener("mousedown", (e) => {
  isDragging = true;
  isInSpecialState = true;

  dragOffsetX = e.clientX - spamton.offsetLeft;
  dragOffsetY = e.clientY - spamton.offsetTop;

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
  if (!isDragging) return;
  isDragging = false;
  isInSpecialState = false;
  flySound.pause();
  flySound.currentTime = 0;
  clearInterval(flyInterval);
  flyInterval = null;

  spamton.style.cursor = "grab";
});



// Function to play a random voice line
function playRandomVoice() {
  const randomIndex = Math.floor(Math.random() * voiceLines.length);
  voiceLines[randomIndex].play();
}

// Play on click
spamton.addEventListener("click", () => {
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


// Decide if dancing every 20 seconds
function ifDance(callback) {
  setTimeout(() => {
    callback(Math.random() < 0.6); // 60% chance to dance
  }, 20000);
}

function startDanceTimer() {
  ifDance((choice) => {
    if (choice) {
      // Randomly pick dance1 or dance2
      currentDanceImages = Math.random() < 0.5 ? dance1Images : dance2Images;
      frame = 0;
    }
    shouldDance = choice;
    startDanceTimer();
  });
}

function startAnimation() {
  startDanceTimer();

  setInterval(() => {
    if (isDragging || isInSpecialState || isLaughState) {
      // Skip idle/dance while flying
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
    }
  }, frameDelay);
}


// Kick off loading and animation
Promise.all([preloadDance1Frames(), preloadDance2Frames()]).then(() => {
  console.log("All frames loaded! Starting animation...");
  startAnimation();
});
