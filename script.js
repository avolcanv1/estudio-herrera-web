function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function updateClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;

  const now = new Date();
  const time = formatTime(now);

  clock.textContent = time;
  clock.setAttribute("datetime", now.toISOString());
}

updateClock();
setInterval(updateClock, 1000);

const MAX_CURSOR_IMAGES = 10;
const SPAWN_INTERVAL_MS = 120;
const HIDE_DELAY_MS = 1400;
const MOBILE_QUERY = "(max-width: 767px)";

let imagePool = [];
let followers = [];
let lastSpawnTime = 0;
let hideTimer = null;

function isMobile() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function randomImageUrl() {
  if (!imagePool.length) return null;
  return imagePool[Math.floor(Math.random() * imagePool.length)];
}

function getCursorContainer() {
  return document.getElementById("cursor-images");
}

function updateFollowers(x, y) {
  followers.forEach((follower) => {
    follower.el.style.left = `${x}px`;
    follower.el.style.top = `${y}px`;
  });
}

function removeFollower(follower) {
  follower.el.classList.remove("is-visible");
  window.setTimeout(() => follower.el.remove(), 300);
}

function spawnFollower(x, y) {
  const src = randomImageUrl();
  const container = getCursorContainer();
  if (!src || !container) return;

  const img = document.createElement("img");
  img.className = "cursor-image";
  img.src = src;
  img.alt = "";
  img.style.left = `${x}px`;
  img.style.top = `${y}px`;
  img.style.zIndex = String(followers.length + 1);
  container.appendChild(img);

  requestAnimationFrame(() => img.classList.add("is-visible"));

  const follower = { el: img };
  followers.push(follower);

  if (followers.length > MAX_CURSOR_IMAGES) {
    const oldest = followers.shift();
    removeFollower(oldest);
  }
}

function clearFollowers() {
  followers.forEach(removeFollower);
  followers = [];
}

function handlePointerMove(clientX, clientY, { forceSpawn = false } = {}) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!imagePool.length) return;

  const now = Date.now();

  if (forceSpawn || now - lastSpawnTime >= SPAWN_INTERVAL_MS) {
    spawnFollower(clientX, clientY);
    lastSpawnTime = now;
  }

  updateFollowers(clientX, clientY);

  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(clearFollowers, HIDE_DELAY_MS);
}

function onMouseMove(event) {
  handlePointerMove(event.clientX, event.clientY);
}

function onTouchStart(event) {
  if (!isMobile()) return;
  const touch = event.touches[0];
  if (!touch) return;
  handlePointerMove(touch.clientX, touch.clientY, { forceSpawn: true });
}

function onTouchMove(event) {
  if (!isMobile()) return;
  const touch = event.touches[0];
  if (!touch) return;
  handlePointerMove(touch.clientX, touch.clientY);
}

async function loadInstagramImages() {
  try {
    const response = await fetch("instagram-images.json");
    if (!response.ok) return;

    const images = await response.json();
    if (Array.isArray(images) && images.length) {
      imagePool = images;
    }
  } catch {
    imagePool = [];
  }
}

loadInstagramImages();
document.addEventListener("mousemove", onMouseMove);
document.addEventListener("touchstart", onTouchStart, { passive: true });
document.addEventListener("touchmove", onTouchMove, { passive: true });
document.addEventListener("mouseleave", clearFollowers);
document.addEventListener("touchend", () => {
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(clearFollowers, HIDE_DELAY_MS);
});
