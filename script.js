/*
  ======================================================================
  ADIVINA LA CANCIÓN — lógica del juego
  ======================================================================
  - El ranking se guarda en localStorage (persiste entre partidas y
    entre cierres del navegador, en esta misma computadora/navegador).
  - Se guarda solo la MEJOR puntuación de cada nombre de jugador.
  ======================================================================
*/

const STORAGE_KEY = "adivinaCancion.leaderboard";

// ---------- Estado del juego ----------
let state = {
  playerName: "",
  category: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  timeLeft: SECONDS_PER_QUESTION,
  timerInterval: null,
  answered: false
};

// ---------- Utilidades ----------
function $(selector) { return document.querySelector(selector); }
function $all(selector) { return document.querySelectorAll(selector); }

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function showScreen(id) {
  $all(".screen").forEach(s => s.classList.remove("active"));
  $(`#${id}`).classList.add("active");
}

// ---------- Navegación entre pantallas ----------
$all(".btn-back").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.target));
});

function confirmPlayerName() {
  const name = $("#player-name").value.trim();
  if (!name) {
    $("#player-name").focus();
    $("#player-name").style.outline = "2px solid var(--magenta)";
    return;
  }
  state.playerName = name;
  buildCategoryGrid();
  showScreen("screen-categories");
}

$("#btn-go-categories").addEventListener("click", confirmPlayerName);

$("#player-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    confirmPlayerName();
  }
});
$("#player-name").addEventListener("input", () => {
  $("#player-name").style.outline = "";
});

$("#btn-go-leaderboard-home").addEventListener("click", () => {
  renderLeaderboard();
  showScreen("screen-leaderboard");
});
$("#btn-go-leaderboard").addEventListener("click", () => {
  renderLeaderboard();
  showScreen("screen-leaderboard");
});

$("#btn-play-again").addEventListener("click", () => {
  buildCategoryGrid();
  showScreen("screen-categories");
});

// ---------- Pantalla de categorías ----------
function buildCategoryGrid() {
  const grid = $("#category-grid");
  grid.innerHTML = "";
  SONG_CATEGORIES.forEach(cat => {
    const tile = document.createElement("button");
    tile.className = "category-tile";
    tile.innerHTML = `<span class="icon">${cat.icon || "🎵"}</span>${cat.name}`;
    tile.addEventListener("click", () => startGame(cat));
    grid.appendChild(tile);
  });
}

// ---------- Iniciar partida ----------
function startGame(category) {
  state.category = category;
  const pool = shuffle(category.songs);
  const count = Math.min(ROUNDS_PER_GAME, pool.length);
  state.questions = pool.slice(0, count).map(song => {
    const options = shuffle([song.title, ...song.options]);
    return { ...song, options };
  });
  state.currentIndex = 0;
  state.score = 0;
  state.correctCount = 0;
  $("#round-total").textContent = state.questions.length;
  $("#live-score").textContent = "0";
  showScreen("screen-game");
  loadQuestion();
}

// ---------- Cargar pregunta ----------
function loadQuestion() {
  clearInterval(state.timerInterval);
  state.answered = false;
  const q = state.questions[state.currentIndex];

  $("#question-tag").textContent = `PREGUNTA ${state.currentIndex + 1}`;
  $("#round-counter").textContent = state.currentIndex + 1;

  const audio = $("#audio-player");
  audio.pause();
  audio.currentTime = 0;
  audio.src = q.audio;
  $("#btn-play-audio").classList.remove("playing");

  const grid = $("#answers-grid");
  grid.innerHTML = "";
  q.options.forEach(option => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = option;
    btn.addEventListener("click", () => submitAnswer(btn, option, q.title));
    grid.appendChild(btn);
  });

  startTimer();
}

$("#btn-play-audio").addEventListener("click", () => {
  const audio = $("#audio-player");
  const btn = $("#btn-play-audio");
  if (audio.paused) {
    audio.play().catch(() => {
      // El archivo de audio no existe todavía: recuérdale al usuario
      // que debe agregar sus propios clips en songs.js / carpeta audio.
      console.warn("No se pudo reproducir el audio. Revisa la ruta en songs.js");
    });
    btn.classList.add("playing");
  } else {
    audio.pause();
    btn.classList.remove("playing");
  }
});
$("#audio-player").addEventListener("ended", () => {
  $("#btn-play-audio").classList.remove("playing");
});

// ---------- Temporizador ----------
function startTimer() {
  state.timeLeft = SECONDS_PER_QUESTION;
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.timeLeft -= 1;
    updateTimerDisplay();
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      if (!state.answered) revealAnswer(null);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const pct = Math.max(0, (state.timeLeft / SECONDS_PER_QUESTION) * 100);
  $("#timer-fill").style.width = `${pct}%`;
  const m = Math.floor(state.timeLeft / 60);
  const s = String(Math.max(0, state.timeLeft) % 60).padStart(2, "0");
  $("#timer-label").textContent = `${m}:${s}`;
}

// ---------- Responder ----------
function submitAnswer(button, chosen, correctTitle) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timerInterval);

  const isCorrect = chosen === correctTitle;
  if (isCorrect) {
    const bonus = Math.max(0, state.timeLeft) * SPEED_BONUS_PER_SECOND;
    state.score += BASE_POINTS + bonus;
    state.correctCount += 1;
    $("#live-score").textContent = state.score;
  }
  revealAnswer(button);
}

function revealAnswer(clickedButton) {
  const q = state.questions[state.currentIndex];
  $("#audio-player").pause();
  $("#btn-play-audio").classList.remove("playing");

  $all(".answer-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === q.title) {
      btn.classList.add("correct");
    } else if (btn === clickedButton) {
      btn.classList.add("wrong");
    }
  });

  setTimeout(() => {
    state.currentIndex += 1;
    if (state.currentIndex < state.questions.length) {
      loadQuestion();
    } else {
      endGame();
    }
  }, 1400);
}

// ---------- Fin de partida ----------
function endGame() {
  $("#result-name").textContent = `¡Bien jugado, ${state.playerName}!`;
  $("#final-score").textContent = state.score;
  $("#result-detail").textContent =
    `Aciertos: ${state.correctCount} de ${state.questions.length}`;
  showScreen("screen-results");
}

$("#btn-save-score").addEventListener("click", () => {
  saveScore(state.playerName, state.score);
  $("#btn-save-score").textContent = "¡Guardado!";
  $("#btn-save-score").disabled = true;
  setTimeout(() => {
    renderLeaderboard();
    showScreen("screen-leaderboard");
  }, 500);
});

// ---------- Tabla de puntuaciones (localStorage) ----------
function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveScore(name, score) {
  const board = loadLeaderboard();
  const existing = board.find(
    entry => entry.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    if (score > existing.score) {
      existing.score = score;
      existing.date = new Date().toISOString();
    }
  } else {
    board.push({ name, score, date: new Date().toISOString() });
  }
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));

  $("#btn-save-score").disabled = false;
  $("#btn-save-score").textContent = "Guardar puntuación";
}

function renderLeaderboard() {
  const board = loadLeaderboard().sort((a, b) => b.score - a.score);
  const list = $("#leaderboard-list");
  list.innerHTML = "";

  if (board.length === 0) {
    list.innerHTML = `<li class="leaderboard-empty" style="justify-content:center;">Todavía no hay puntuaciones guardadas.</li>`;
    return;
  }

  board.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-score">${entry.score} pts</span>
      <button class="btn-delete-entry" title="Eliminar a ${escapeHtml(entry.name)}" aria-label="Eliminar a ${escapeHtml(entry.name)}">&times;</button>
    `;
    li.querySelector(".btn-delete-entry").addEventListener("click", () => {
      if (confirm(`¿Eliminar a "${entry.name}" de la tabla de puntuaciones?`)) {
        deleteScore(entry.name);
      }
    });
    list.appendChild(li);
  });
}

function deleteScore(name) {
  const board = loadLeaderboard().filter(
    entry => entry.name.toLowerCase() !== name.toLowerCase()
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  renderLeaderboard();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Actualización automática de la tabla ----------
// Si la tabla de puntuaciones está abierta en otra pestaña o ventana del
// MISMO navegador (por ejemplo una pantalla grande conectada a la misma
// computadora), este evento se dispara solo y refresca la lista sin que
// nadie tenga que volver a entrar a la pantalla.
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    renderLeaderboard();
  }
});

// ---------- Inicio ----------
renderLeaderboard();
