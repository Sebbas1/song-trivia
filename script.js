/*
  ======================================================================
  ADIVINA LA CANCIÓN — lógica del juego
  ======================================================================
  Los puntajes se guardan en Firebase Firestore (ver firebase-config.js)
  para que todos los celulares compartan el mismo ranking.
  ======================================================================
*/

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

$("#btn-play-again").addEventListener("click", () => {
  buildCategoryGrid();
  showScreen("screen-categories");
});

// ---------- Pantalla de artistas ----------
function buildCategoryGrid() {
  const grid = $("#category-grid");
  grid.innerHTML = "";
  SONG_CATEGORIES.forEach(cat => {
    const tile = document.createElement("button");
    tile.className = "artist-tile";
    tile.innerHTML = `
      <span class="artist-photo" style="background-image: url('${cat.image}')"></span>
      <span class="artist-name">${cat.name}</span>
    `;
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

  // Se reproduce solo al entrar a la pregunta.
  audio.play()
    .then(() => $("#btn-play-audio").classList.add("playing"))
    .catch(() => {
      // Si el navegador bloquea la reproducción automática, el botón
      // sigue disponible para que el jugador le dé play manualmente.
      console.warn("Reproducción automática bloqueada, usa el botón de play.");
    });

  // Reproduce el fragmento automáticamente al entrar a la pregunta.
  audio.play()
    .then(() => $("#btn-play-audio").classList.add("playing"))
    .catch(() => {
      // Algunos navegadores bloquean el autoplay hasta que haya
      // habido una interacción del usuario en la página. Si pasa,
      // el jugador puede darle clic al botón para escucharlo igual.
      console.warn("El navegador bloqueó el autoplay. Usa el botón de reproducir.");
    });

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
  // Se guarda automáticamente apenas termina la partida, sin necesidad
  // de que el jugador presione ningún botón.
  saveScore(state.playerName, state.score);
  showScreen("screen-results");
}

// ---------- Tabla de puntuaciones (localStorage) ----------
// Como un solo dispositivo (tablet o computadora) es el que usan todos
// los participantes por turnos, guardar en el propio navegador es
// suficiente: no depende de internet ni de servicios externos.
const STORAGE_KEY = "adivinaCancion.leaderboard";

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
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Inicio ----------
// (No hace falta nada aquí: la primera pantalla ya está lista en el HTML.)