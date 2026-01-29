// === Settings ===
// Hover sound (source: your local uploaded file tap_01.wav)
const HOVER_SOUND_URL = "./tap_01.wav";

// Timezone for Zrenjanin, RS (source: your request)
const TZ = "Europe/Belgrade";

// === Clock ===
function updateClock() {
  const now = new Date();

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);

  const hour = timeParts.find(p => p.type === "hour")?.value ?? "--";
  const minute = timeParts.find(p => p.type === "minute")?.value ?? "--";

  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short"
  }).format(now).toUpperCase();

  const clockEl = document.getElementById("clock");
  const dayEl = document.getElementById("day");

  if (clockEl) clockEl.textContent = `${hour}:${minute}`;
  if (dayEl) dayEl.textContent = day;
}

updateClock();
setInterval(updateClock, 1000 * 10);

// === Hover Sound (unlock + play) ===
let unlocked = false;

const audioBase = new Audio();
audioBase.src = HOVER_SOUND_URL;
audioBase.preload = "auto";
audioBase.volume = 0.7;

async function unlockAudioOnce() {
  if (unlocked) return;
  try {
    const prevVol = audioBase.volume;
    audioBase.volume = 0.0;
    audioBase.currentTime = 0;

    await audioBase.play();
    audioBase.pause();
    audioBase.currentTime = 0;
    audioBase.volume = prevVol;

    unlocked = true;
  } catch {
    unlocked = false;
  }
}

window.addEventListener("pointerdown", unlockAudioOnce, { capture: true, passive: true });
window.addEventListener("click", unlockAudioOnce, { capture: true, passive: true });
window.addEventListener("keydown", unlockAudioOnce, { capture: true });

// Play sound ONLY on elements with .hover-sound
const hoverEls = document.querySelectorAll(".hover-sound");
let lastPlay = 0;
const COOLDOWN_MS = 80;

function playHoverSound() {
  const now = performance.now();
  if (now - lastPlay < COOLDOWN_MS) return;
  lastPlay = now;

  if (!unlocked) return;

  const a = audioBase.cloneNode(true);
  a.volume = audioBase.volume;
  a.currentTime = 0;
  a.play().catch(() => {});
}

hoverEls.forEach(el => {
  el.addEventListener("mouseenter", playHoverSound);
  el.addEventListener("focus", playHoverSound);
});

// === Modal open / close ===
const openBtn = document.getElementById("openForm");
const closeBtn = document.getElementById("closeForm");
const modal = document.getElementById("contactModal");

function openModal() {
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function resetFormUI() {
  const formBody = document.getElementById("formBody");
  const success = document.getElementById("formSuccess");
  const errorBox = document.getElementById("formError");
  const submitBtn = document.querySelector("#contactForm .submit");

  if (formBody) formBody.style.display = "";
  if (success) success.style.display = "none";
  if (errorBox) errorBox.style.display = "none";

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Request";
  }
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  resetFormUI();
}

if (openBtn) openBtn.addEventListener("click", openModal);
if (closeBtn) closeBtn.addEventListener("click", closeModal);

if (modal) {
  const overlay = modal.querySelector(".modal__overlay");
  if (overlay) overlay.addEventListener("click", closeModal);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && modal.classList.contains("active")) {
    closeModal();
  }
});

// === Formspree submit ===
const form = document.getElementById("contactForm");
const formBody = document.getElementById("formBody");
const success = document.getElementById("formSuccess");
const errorBox = document.getElementById("formError");

if (form) {
  // Ensure hidden states on load
  if (success) success.style.display = "none";
  if (errorBox) errorBox.style.display = "none";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Hide old states
    if (success) success.style.display = "none";
    if (errorBox) errorBox.style.display = "none";

    const submitBtn = form.querySelector(".submit");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      });

      if (res.ok) {
        if (formBody) formBody.style.display = "none";
        if (success) success.style.display = "block";
        form.reset();

        setTimeout(() => closeModal(), 3000);
      } else {
        if (errorBox) errorBox.style.display = "block";
      }
    } catch {
      if (errorBox) errorBox.style.display = "block";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Request";
      }
    }
  });
}
