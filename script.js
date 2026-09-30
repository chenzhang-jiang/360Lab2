
const SAVE_KEY = "myLittleBalconyFinal";

const $ = (id) => document.getElementById(id);
const tools = [...document.querySelectorAll(".tool")];
const shelfSlots = [$("shelf-0"), $("shelf-1"), $("shelf-2"), $("shelf-3")];

const FLOWERS = ["Clover", "Violet", "Tulip", "Daisy", "Lavender", "Rose", "Bluebell", "Sunflower"];
const flowerImage = (name) => `images/${name.toLowerCase()}.png`;

let player = "";
let selectedTool = "";
let timer;

let game = freshGame();

function freshGame() {
  return {
    step: "pot",
    weather: "Sunny",
    currentFlower: "",
    unlocked: [],
    history: [],
    tutorialDone: false
  };
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ player, game }));
}

function load() {
  const data = localStorage.getItem(SAVE_KEY);
  if (!data) return false;
  const saved = JSON.parse(data);
  player = saved.player || "";
  game = { ...freshGame(), ...(saved.game || {}) };
  return !!player;
}

function show(screen) {
  [$("start-screen"), $("save-screen"), $("game-screen")].forEach(x => x.classList.add("hidden"));
  $(screen).classList.remove("hidden");
}

function updateContinue() {
  const hasSave = !!localStorage.getItem(SAVE_KEY);
  $("continue-btn").classList.toggle("hidden", !hasSave);
  $("continue-note").classList.toggle("hidden", !hasSave);
}

function message(text) {
  clearTimeout(timer);
  $("message").textContent = text;
  $("message").classList.remove("hidden");
  timer = setTimeout(() => $("message").classList.add("hidden"), 1500);
}

function enterGame() {
  $("player-name").textContent = player;
  setWeather(game.weather);
  drawPlant();
  drawShelf();
  updateTip();
  save();
}

function setWeather(weather) {
  game.weather = weather;
  $("weather-name").textContent = weather;
  $("sky").className = `sky ${weather.toLowerCase()}`;
  $("balcony").className = `balcony ${weather.toLowerCase()}`;
}

function chooseTool(name) {
  selectedTool = name;
  tools.forEach(btn => btn.classList.toggle("selected", btn.dataset.tool === name));
  const help = {
    pot: "Flower Pot selected — click the plant spot or drag the pot.",
    shovel: "Shovel selected — use it on the flower pot.",
    seed: "Mystery Seed selected — plant it in the prepared soil.",
    water: "Watering Can selected — water the seed."
  };
  $("tool-help").textContent = help[name];
}

function clearTool() {
  selectedTool = "";
  tools.forEach(btn => btn.classList.remove("selected"));
  $("tool-help").textContent = "Click a tool, then click the plant spot — or drag the tool directly.";
}

function useTool(tool) {
  const expected = { pot: "pot", soil: "shovel", seed: "seed", water: "water" };
  if (tool !== expected[game.step]) {
    message(`Try the ${expected[game.step] === "pot" ? "Flower Pot" : expected[game.step]}.`);
    return;
  }

  if (game.step === "pot") game.step = "soil";
  else if (game.step === "soil") game.step = "seed";
  else if (game.step === "seed") {
    game.currentFlower = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
    game.step = "water";
  }
  else if (game.step === "water") game.step = "sun";

  clearTool();
  drawPlant(true);
  updateTip();
  save();

  if (game.step === "sun" && game.weather === "Rainy") {
    setTimeout(grow, 1600);
  }
}

function grow() {
  if (game.step !== "sun") return;
  game.step = "grow";
  drawPlant(true);
  updateTip();
  save();
  setTimeout(bloom, 2200);
}

function bloom() {
  if (game.step !== "grow") return;
  game.step = "bloom";
  drawPlant(true);

  const isNew = !game.unlocked.includes(game.currentFlower);
  if (isNew) game.unlocked.push(game.currentFlower);
  game.history.push(game.currentFlower);
  game.tutorialDone = true;

  drawShelf();
  $("bloom-img").src = flowerImage(game.currentFlower);
  $("bloom-text").textContent = isNew
    ? `You grew a ${game.currentFlower}!`
    : `You grew another ${game.currentFlower}!`;
  $("unlock-text").textContent = isNew
    ? "New flower unlocked! It has been added to your flower shelf."
    : "You already discovered this flower, but it has been added to your flower history.";

  save();
  setTimeout(() => $("bloom-popup").classList.remove("hidden"), 900);
}

function plantAgain() {
  $("bloom-popup").classList.add("hidden");
  game.step = "pot";
  game.currentFlower = "";
  setWeather(Math.random() < 0.5 ? "Sunny" : "Rainy");
  clearTool();
  drawPlant();
  updateTip();
  save();
}

function drawPlant(animate = false) {
  const stage = $("plant-stage");
  const label = $("spot-label");
  stage.innerHTML = "";

  const imageForStep = {
    soil: "images/pot-empty.png",
    seed: "images/pot-soil.png",
    water: "images/pot-seed.png",
    sun: "images/pot-sprout.png",
    grow: "images/pot-growing.png",
    bloom: game.currentFlower ? flowerImage(game.currentFlower) : ""
  };

  const src = imageForStep[game.step];
  label.style.opacity = src ? "0" : ".45";
  if (!src) return;

  const img = document.createElement("img");
  img.src = src;
  img.alt = "Current plant";
  stage.appendChild(img);

  if (animate) {
    stage.classList.remove("grow");
    void stage.offsetWidth;
    stage.classList.add("grow");
  }
}

function drawShelf() {
  shelfSlots.forEach(slot => slot.innerHTML = "");
  game.unlocked.slice(0, 4).forEach((flower, i) => {
    const img = document.createElement("img");
    img.src = flowerImage(flower);
    img.alt = flower;
    img.title = flower;
    shelfSlots[i].appendChild(img);
  });
}

function updateTip() {
  const tip = {
    pot: game.tutorialDone
      ? `It is a ${game.weather.toLowerCase()} day. Place your Flower Pot on the plant spot.`
      : `Welcome, ${player}. This little balcony is yours now. Place your Flower Pot on the plant spot.`,
    soil: "Good! Now use the Shovel to prepare the soil.",
    seed: "The soil is ready. Plant your Mystery Seed.",
    water: "Your Mystery Seed is planted. Give it some water.",
    sun: game.weather === "Sunny"
      ? "A tiny sprout appeared! There are two kinds of weather: sunny days and rainy days. Today is sunny. Press SPACE to give your plant some sunshine."
      : "A tiny sprout appeared! Today is rainy. The rain will help your plant grow.",
    grow: "Your plant is growing...",
    bloom: `Your ${game.currentFlower} has bloomed!`
  };
  $("tip-text").textContent = tip[game.step];
  $("space-hint").classList.toggle("hidden", !(game.step === "sun" && game.weather === "Sunny"));
}

function openGallery() {
  const list = $("gallery-list");
  list.innerHTML = "";

  if (!game.history.length) {
    list.innerHTML = '<div class="empty">You have not grown any flowers yet.</div>';
  } else {
    const count = {};
    game.history.forEach(f => count[f] = (count[f] || 0) + 1);
    Object.entries(count).forEach(([name, total]) => {
      const card = document.createElement("div");
      card.className = "flower-card";
      card.innerHTML = `<img src="${flowerImage(name)}" alt="${name}"><h4>${name}</h4><p>Grown: ${total}</p>`;
      list.appendChild(card);
    });
  }
  $("gallery").classList.remove("hidden");
}

function saveAndExit() {
  save();
  updateContinue();
  show("start-screen");
}

// Start / Save
$("start-btn").onclick = () => {
  $("name-input").value = "";
  show("save-screen");
};
$("continue-btn").onclick = () => {
  if (load()) {
    show("game-screen");
    enterGame();
  }
};
$("create-btn").onclick = () => {
  const name = $("name-input").value.trim();
  if (!name) return alert("Please enter your name.");
  player = name;
  game = freshGame();
  save();
  show("game-screen");
  enterGame();
};
$("name-input").addEventListener("keydown", e => { if (e.key === "Enter") $("create-btn").click(); });

// Tools
for (const btn of tools) {
  btn.onclick = () => chooseTool(btn.dataset.tool);
  btn.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", btn.dataset.tool));
}

const spot = $("plant-spot");
spot.onclick = () => selectedTool ? useTool(selectedTool) : message("Choose a tool first.");
spot.addEventListener("dragover", e => { e.preventDefault(); spot.classList.add("drag-over"); });
spot.addEventListener("dragleave", () => spot.classList.remove("drag-over"));
spot.addEventListener("drop", e => {
  e.preventDefault();
  spot.classList.remove("drag-over");
  useTool(e.dataTransfer.getData("text/plain"));
});

// Keyboard
window.addEventListener("keydown", e => {
  if (e.code === "Space" && game.step === "sun" && game.weather === "Sunny" && !$("game-screen").classList.contains("hidden")) {
    e.preventDefault();
    grow();
  }
  if (e.key === "Escape") $("gallery").classList.add("hidden");
});

// Buttons
$("again-btn").onclick = plantAgain;
$("flowers-btn").onclick = openGallery;
$("shelf-btn").onclick = openGallery;
$("close-gallery").onclick = () => $("gallery").classList.add("hidden");
$("exit-btn").onclick = saveAndExit;

// Window resize interaction
window.addEventListener("resize", () => {
  if (window.innerWidth < 720 && !$("game-screen").classList.contains("hidden")) {
    $("cozy").classList.remove("hidden");
    clearTimeout(timer);
    timer = setTimeout(() => $("cozy").classList.add("hidden"), 1200);
  }
});

// Initial state
if (load()) updateContinue();
else updateContinue();
show("start-screen");
