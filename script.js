const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const emojis = {
  pedra: "🪨",
  papel: "📄",
  tesoura: "✂️",
};

let gameInterval;
let timerInterval;
let timeElapsed = 0;
let paused = false;

const entities = [];
let pedraCountLive = 0,
  papelCountLive = 0,
  tesouraCountLive = 0;

function createEntity(type, x, y) {
  return {
    type: type,
    emoji: emojis[type],
    x: x,
    y: y,
    dx: (Math.random() * 2 - 1) * 3,
    dy: (Math.random() * 2 - 1) * 3,
    radius: 20,
    mass: 1,
  };
}

function checkCollision(entityA, entityB) {
  const dist = Math.hypot(entityA.x - entityB.x, entityA.y - entityB.y);
  return dist < entityA.radius * 2;
}

function resolveCollision(entityA, entityB) {
  const xVelocityDiff = entityA.dx - entityB.dx;
  const yVelocityDiff = entityA.dy - entityB.dy;
  const xDist = entityB.x - entityA.x;
  const yDist = entityB.y - entityA.y;

  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
    const angle = -Math.atan2(entityB.y - entityA.y, entityB.x - entityA.x);

    const u1 = rotate(entityA.dx, entityA.dy, angle);
    const u2 = rotate(entityB.dx, entityB.dy, angle);

    const v1 = { dx: u2.dx, dy: u1.dy };
    const v2 = { dx: u1.dx, dy: u2.dy };

    const finalVel1 = rotate(v1.dx, v1.dy, -angle);
    const finalVel2 = rotate(v2.dx, v2.dy, -angle);

    entityA.dx = finalVel1.dx;
    entityA.dy = finalVel1.dy;

    entityB.dx = finalVel2.dx;
    entityB.dy = finalVel2.dy;
  }
}

function rotate(dx, dy, angle) {
  return {
    dx: dx * Math.cos(angle) - dy * Math.sin(angle),
    dy: dx * Math.sin(angle) + dy * Math.cos(angle),
  };
}

function transform(a, b) {
  if (a.type === "pedra" && b.type === "tesoura") b.type = "pedra";
  else if (a.type === "tesoura" && b.type === "papel") b.type = "tesoura";
  else if (a.type === "papel" && b.type === "pedra") b.type = "papel";
  else if (b.type === "pedra" && a.type === "tesoura") a.type = "pedra";
  else if (b.type === "tesoura" && a.type === "papel") a.type = "tesoura";
  else if (b.type === "papel" && a.type === "pedra") a.type = "papel";
}

function updateEntities() {
  pedraCountLive = papelCountLive = tesouraCountLive = 0;

  for (let entity of entities) {
    entity.x += entity.dx;
    entity.y += entity.dy;

    if (
      entity.x - entity.radius < 0 ||
      entity.x + entity.radius > canvas.width
    ) {
      entity.dx *= -1;
    }
    if (
      entity.y - entity.radius < 0 ||
      entity.y + entity.radius > canvas.height
    ) {
      entity.dy *= -1;
    }

    for (let other of entities) {
      if (entity !== other && checkCollision(entity, other)) {
        resolveCollision(entity, other);
        transform(entity, other);
      }
    }

    if (entity.type === "pedra") pedraCountLive++;
    if (entity.type === "papel") papelCountLive++;
    if (entity.type === "tesoura") tesouraCountLive++;
  }

  document.getElementById("pedraCountLive").textContent = pedraCountLive;
  document.getElementById("papelCountLive").textContent = papelCountLive;
  document.getElementById("tesouraCountLive").textContent = tesouraCountLive;
}

function drawEntities() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let entity of entities) {
    ctx.font = "30px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojis[entity.type], entity.x, entity.y);
  }
}

function checkWinner() {
  const firstType = entities[0].type;
  return entities.every((entity) => entity.type === firstType);
}

function gameLoop() {
  if (!paused) {
    updateEntities();
    drawEntities();

    if (checkWinner()) {
      clearInterval(gameInterval);
      clearInterval(timerInterval);
      showEndMessage(
        `Jogo terminou! Todos viraram ${emojis[entities[0].type]}!`
      );
      return;
    }

    gameInterval = requestAnimationFrame(gameLoop);
  }
}

function startTimer() {
  timeElapsed = 0;
  document.getElementById("timer").textContent = timeElapsed;

  timerInterval = setInterval(() => {
    if (!paused) {
      timeElapsed++;
      document.getElementById("timer").textContent = timeElapsed;
    }
  }, 1000);
}

function showEndMessage(message) {
  const endMessage = document.getElementById("endMessage");
  endMessage.innerHTML = `<h2>${message}</h2><button id="restartGameEnd"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M459.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-320c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4L288 214.3l0 41.7 0 41.7L459.5 440.6zM256 352l0-96 0-128 0-32c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160C4.2 237.5 0 246.5 0 256s4.2 18.5 11.5 24.6l192 160c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29l0-64z"/></svg> Reiniciar</button>`;
  endMessage.style.display = "block";

  document
    .getElementById("restartGameEnd")
    .addEventListener("click", restartGame);
}

document.getElementById("pauseButton").addEventListener("click", () => {
  paused = true;
  document.getElementById("pauseScreen").style.display = "block";
  document.getElementById("pauseButton").style.display = "none";
});

document.getElementById("resumeGame").addEventListener("click", () => {
  paused = false;
  document.getElementById("pauseScreen").style.display = "none";
  document.getElementById("pauseButton").style.display = "flex";
  gameLoop();
});

function restartGame() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  entities.length = 0;
  paused = false;
  document.getElementById("endMessage").style.display = "none";
  document.getElementById("pauseScreen").style.display = "none";
  document.getElementById("startScreen").classList.remove("hidden");
  canvas.style.display = "none";
  document.getElementById("pauseButton").style.display = "none";
}

document.getElementById("startGame").addEventListener("click", () => {
  const pedraCount = parseInt(document.getElementById("pedraCount").value);
  const papelCount = parseInt(document.getElementById("papelCount").value);
  const tesouraCount = parseInt(document.getElementById("tesouraCount").value);

  entities.length = 0;

  for (let i = 0; i < pedraCount; i++) {
    entities.push(
      createEntity(
        "pedra",
        Math.random() * canvas.width,
        Math.random() * canvas.height
      )
    );
  }
  for (let i = 0; i < papelCount; i++) {
    entities.push(
      createEntity(
        "papel",
        Math.random() * canvas.width,
        Math.random() * canvas.height
      )
    );
  }
  for (let i = 0; i < tesouraCount; i++) {
    entities.push(
      createEntity(
        "tesoura",
        Math.random() * canvas.width,
        Math.random() * canvas.height
      )
    );
  }

  document.getElementById("startScreen").classList.add("hidden");
  canvas.style.display = "block";
  document.getElementById("pauseButton").style.display = "flex";

  startTimer();
  gameLoop();
});

document.getElementById("restartGame").addEventListener("click", restartGame);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
