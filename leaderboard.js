/*
  TABLA DE PUNTUACIONES MULTICELULAR
  Lee Firestore en tiempo real. El parámetro ?room= define la sala.
*/

const ROOM_ID = getRoomId();
const LOCAL_STORAGE_KEY = `adivinaCancion.leaderboard.${ROOM_ID}`;
let unsubscribeLeaderboard = null;

function $(selector) { return document.querySelector(selector); }

function getRoomId() {
  const raw = new URLSearchParams(window.location.search).get("room") || "general";
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "general";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

function renderLeaderboard(board) {
  const list = $("#leaderboard-list");
  list.innerHTML = "";

  if (!board.length) {
    list.innerHTML = `<li class="leaderboard-empty" style="justify-content:center;">Todavía no hay puntuaciones en esta sala.</li>`;
    return;
  }

  board.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}<small class="lb-artist">${escapeHtml(entry.artist || "")}</small></span>
      <span class="lb-score">${Number(entry.score || 0)} pts</span>
    `;
    list.appendChild(li);
  });
}

function loadLocalLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]")
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  } catch (_) {
    return [];
  }
}

async function initLeaderboard() {
  $("#room-label").textContent = ROOM_ID === "general" ? "Sala general" : `Sala: ${ROOM_ID}`;
  $("#back-to-game").href = `index.html?room=${encodeURIComponent(ROOM_ID)}`;

  const firebaseOk = await window.firebaseReady;
  if (!firebaseOk || !window.gameDb) {
    $("#leaderboard-status").textContent = "Firebase aún no está configurado: se muestran solo datos guardados en este dispositivo.";
    renderLeaderboard(loadLocalLeaderboard());
    return;
  }

  $("#leaderboard-status").textContent = "Marcador en vivo";
  const query = window.gameDb
    .collection("rooms")
    .doc(ROOM_ID)
    .collection("scores")
    .orderBy("score", "desc")
    .limit(100);

  unsubscribeLeaderboard = query.onSnapshot(snapshot => {
    const board = snapshot.docs.map(doc => doc.data());
    renderLeaderboard(board);
  }, error => {
    console.error("Error leyendo el ranking:", error);
    $("#leaderboard-status").textContent = "No se pudo cargar el marcador compartido.";
  });
}

window.addEventListener("beforeunload", () => {
  if (unsubscribeLeaderboard) unsubscribeLeaderboard();
});

initLeaderboard();
