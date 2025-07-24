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

spamton.addEventListener("mousedown", (e) => {
  isDragging = true;
  // Calculate offset to keep cursor relative to image when dragging
  dragOffsetX = e.clientX - spamton.getBoundingClientRect().left;
  dragOffsetY = e.clientY - spamton.getBoundingClientRect().top;
  spamton.style.cursor = "grabbing";
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  // Move spamton, subtract offset so it doesn’t jump
  spamton.style.left = `${e.clientX - dragOffsetX}px`;
  spamton.style.top = `${e.clientY - dragOffsetY}px`;
});

window.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    spamton.style.cursor = "grab";
  }
});


// Function to play a random voice line
function playRandomVoice() {
  const randomIndex = Math.floor(Math.random() * voiceLines.length);
  voiceLines[randomIndex].play();
}

// Play on click
spamton.addEventListener("click", () => {
  playRandomVoice();
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
    if (shouldDance && currentDanceImages) {
      frame++;
      if (frame >= currentDanceImages.length) {
        shouldDance = false;
        frame = 0;
        spamton.src = idleImages[0].src; // reset to idle first frame
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
