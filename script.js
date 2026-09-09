/*
  ADIVINA LA CANCIÓN — SALAS CONTROLADAS POR HOST
  El alumno entra con ?room=nombre-sala.
  Solo puede comenzar cuando el host marca la sala como "open" en Firestore.
*/

const ROOM_ID = getRoomId();
const LOCAL_STORAGE_KEY = `adivinaCancion.leaderboard.${ROOM_ID}`; // respaldo local por sala si Firebase falla
let unsubscribeRoom = null;
let roomIsOpen = false;

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

function $(selector) { return document.querySelector(selector); }
function $all(selector) { return document.querySelectorAll(selector); }

function getRoomId() {
  const raw = new URLSearchParams(window.location.search).get("room") || "general";
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "general";
}

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

function buildAnswerOptions(category, song) {
  const autoDistractors = shuffle(
    [...new Set(category.songs.map(item => item.title))].filter(title => title !== song.title)
  );
  const legacyDistractors = Array.isArray(song.options) ? shuffle(song.options) : [];
  const distractors = [];
  [...autoDistractors, ...legacyDistractors].forEach(title => {
    if (title && title !== song.title && !distractors.includes(title) && distractors.length < 3) {
      distractors.push(title);
    }
  });
  return shuffle([song.title, ...distractors]);
}

function setRoomLinks() {
  $("#room-label").textContent = ROOM_ID === "general" ? "Sala general" : `Sala: ${ROOM_ID}`;
  $all(".leaderboard-link").forEach(link => {
    link.href = `leaderboard.html?room=${encodeURIComponent(ROOM_ID)}`;
  });
}

function setRoomAccess(status, message) {
  roomIsOpen = status === "open";
  const input = $("#player-name");
  const button = $("#btn-go-categories");
  input.disabled = !roomIsOpen;
  button.disabled = !roomIsOpen;
  $("#room-access-message").textContent = message;
  $("#room-access-message").dataset.status = status;
}

async function initRoomControl() {
  setRoomLinks();
  const firebaseOk = await window.firebaseReady;

  if (!firebaseOk || !window.gameDb) {
    setRoomAccess("error", "Firebase no está conectado. Esta sala no puede iniciar todavía.");
    return;
  }

  const roomRef = window.gameDb.collection("rooms").doc(ROOM_ID);
  unsubscribeRoom = roomRef.onSnapshot(snapshot => {
    if (!snapshot.exists) {
      setRoomAccess("missing", "Esta sala todavía no existe. Escanea el QR generado por el host.");
      return;
    }

    const room = snapshot.data();
    if (room.status === "open") {
      setRoomAccess("open", "✓ Sala abierta. Ya puedes jugar.");
    } else if (room.status === "closed") {
      setRoomAccess("closed", "La sala está cerrada. Espera indicaciones del profesor.");
    } else {
      setRoomAccess("waiting", "Esperando a que el profesor inicie la sala…");
    }
  }, error => {
    console.error("No se pudo leer el estado de la sala:", error);
    setRoomAccess("error", "No se pudo comprobar la sala. Revisa la conexión.");
  });
}

$all(".btn-back").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.target));
});

function confirmPlayerName() {
  if (!roomIsOpen) {
    $("#room-access-message").textContent = "El profesor todavía no ha iniciado la sala.";
    return;
  }
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
  if (!roomIsOpen) {
    showScreen("screen-home");
    return;
  }
  buildCategoryGrid();
  showScreen("screen-categories");
});

function buildCategoryGrid() {
  const grid = $("#category-grid");
  grid.innerHTML = "";
  SONG_CATEGORIES.forEach(cat => {
    const tile = document.createElement("button");
    tile.className = "artist-tile";
    tile.innerHTML = `
      <span class="artist-photo" style="background-image: url('${cat.image}')"></span>
      <span class="artist-name">${escapeHtml(cat.name)}</span>
    `;
    tile.addEventListener("click", () => startGame(cat));
    grid.appendChild(tile);
  });
}

function startGame(category) {
  if (!roomIsOpen) {
    showScreen("screen-home");
    return;
  }
  state.category = category;
  const pool = shuffle(category.songs);
  const count = Math.min(ROUNDS_PER_GAME, pool.length);
  state.questions = pool.slice(0, count).map(song => ({
    ...song,
    options: buildAnswerOptions(category, song)
  }));
  state.currentIndex = 0;
  state.score = 0;
  state.correctCount = 0;
  $("#round-total").textContent = state.questions.length;
  $("#live-score").textContent = "0";
  showScreen("screen-game");
  loadQuestion();
}

function loadQuestion() {
  clearInterval(state.timerInterval);
  state.answered = false;
  const q = state.questions[state.currentIndex];

  $("#question-tag").textContent = `PREGUNTA ${state.currentIndex + 1}`;
  $("#round-counter").textContent = state.currentIndex + 1;

  const audio = $("#audio-player");
  audio.pause();
  audio.src = q.audio;
  $("#btn-play-audio").classList.remove("playing");

  // Intenta reproducir automáticamente apenas comienza cada pregunta.
  // Si la canción tiene `start`, ese valor está expresado en segundos.
  const startAt = Number(q.start || 0);
  if (Number.isFinite(startAt) && startAt > 0) {
    audio.addEventListener("loadedmetadata", () => {
      try {
        audio.currentTime = Math.min(startAt, Math.max(0, audio.duration - 0.1));
      } catch (_) {}
    }, { once: true });
  }

  audio.load();
  audio.play()
    .then(() => $("#btn-play-audio").classList.add("playing"))
    .catch(error => console.warn("Autoplay bloqueado. El estudiante puede pulsar Play.", error));

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
    audio.play().then(() => btn.classList.add("playing"))
      .catch(() => console.warn("No se pudo reproducir el audio. Revisa la ruta en songs.js."));
  } else {
    audio.pause();
    btn.classList.remove("playing");
  }
});

$("#audio-player").addEventListener("ended", () => {
  $("#btn-play-audio").classList.remove("playing");
});

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

function submitAnswer(button, chosen, correctTitle) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timerInterval);
  if (chosen === correctTitle) {
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
    if (btn.textContent === q.title) btn.classList.add("correct");
    else if (btn === clickedButton) btn.classList.add("wrong");
  });
  setTimeout(() => {
    state.currentIndex += 1;
    if (state.currentIndex < state.questions.length) loadQuestion();
    else endGame();
  }, 1400);
}

async function endGame() {
  $("#result-name").textContent = `¡Bien jugado, ${state.playerName}!`;
  $("#final-score").textContent = state.score;
  $("#result-detail").textContent = `Aciertos: ${state.correctCount} de ${state.questions.length}`;
  $("#save-status").textContent = "Guardando puntuación…";
  showScreen("screen-results");

  const savedOnline = await saveScore(state.playerName, state.score, state.category.name);
  $("#save-status").textContent = savedOnline
    ? "✓ Puntuación guardada en el ranking general"
    : "No se pudo guardar la puntuación compartida.";
}

async function saveScore(name, score, artist) {
  const firebaseOk = await window.firebaseReady;
  const user = firebase.auth().currentUser;
  if (!firebaseOk || !window.gameDb || !user) {
    saveScoreLocally(name, score, artist);
    return false;
  }

  // Las salas controlan el acceso, pero TODAS las puntuaciones se guardan
  // en una sola colección global: /scores/{uid}.
  const roomRef = window.gameDb.collection("rooms").doc(ROOM_ID);
  const scoreRef = window.gameDb.collection("scores").doc(user.uid);

  try {
    await window.gameDb.runTransaction(async transaction => {
      const roomSnapshot = await transaction.get(roomRef);
      if (!roomSnapshot.exists) throw new Error("La sala ya no existe.");

      const room = roomSnapshot.data();
      const current = await transaction.get(scoreRef);
      if (!current.exists || score > Number(current.data().score || 0)) {
        transaction.set(scoreRef, {
          uid: user.uid,
          name,
          score,
          artist,
          room: ROOM_ID,
          hostUid: room.hostUid,
          date: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    return true;
  } catch (error) {
    console.error("No se pudo guardar en Firestore:", error);
    saveScoreLocally(name, score, artist);
    return false;
  }
}

function saveScoreLocally(name, score, artist) {
  let board = [];
  try { board = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"); } catch (_) {}
  const existing = board.find(entry => entry.name.toLowerCase() === name.toLowerCase());
  if (!existing) board.push({ name, score, artist, date: new Date().toISOString() });
  else if (score > existing.score) Object.assign(existing, { score, artist, date: new Date().toISOString() });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(board));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

window.addEventListener("beforeunload", () => {
  if (unsubscribeRoom) unsubscribeRoom();
});

initRoomControl();
