/* RANKING GENERAL — reúne las mejores puntuaciones de TODAS las salas. */
const ROOM_ID = getRoomId(); // solo se conserva para volver a la sala desde la que llegó el alumno
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
function roomLabel(room) {
  if (!room || room === "general") return "Sala general";
  return `Sala ${room}`;
}
function renderLeaderboard(board) {
  const list = $("#leaderboard-list");
  list.innerHTML = "";
  if (!board.length) {
    list.innerHTML = `<li class="leaderboard-empty" style="justify-content:center;">Todavía no hay puntuaciones en el ranking general.</li>`;
    return;
  }
  board.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}
        <small class="lb-artist">${escapeHtml(entry.artist || "")} · ${escapeHtml(roomLabel(entry.room))}</small>
      </span>
      <span class="lb-score">${Number(entry.score || 0)} pts</span>
    `;
    list.appendChild(li);
  });
}

function loadAllLocalScores() {
  const bestByName = new Map();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("adivinaCancion.leaderboard.")) continue;
    const room = key.replace("adivinaCancion.leaderboard.", "") || "general";
    let entries = [];
    try { entries = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) {}
    entries.forEach(entry => {
      const id = String(entry.name || "").trim().toLowerCase();
      if (!id) return;
      const candidate = { ...entry, room };
      const current = bestByName.get(id);
      if (!current || Number(candidate.score || 0) > Number(current.score || 0)) bestByName.set(id, candidate);
    });
  }
  return [...bestByName.values()].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

async function initLeaderboard() {
  $("#back-to-game").href = `index.html?room=${encodeURIComponent(ROOM_ID)}`;

  const firebaseOk = await window.firebaseReady;
  if (!firebaseOk || !window.gameDb) {
    $("#leaderboard-status").textContent = "Firebase no está disponible: se muestran únicamente los respaldos guardados en este dispositivo.";
    renderLeaderboard(loadAllLocalScores());
    return;
  }

  $("#leaderboard-status").textContent = "Ranking general · mejores puntuaciones de todas las salas · actualización en tiempo real";
  const query = window.gameDb.collection("scores").orderBy("score", "desc").limit(100);
  unsubscribeLeaderboard = query.onSnapshot(snapshot => {
    renderLeaderboard(snapshot.docs.map(doc => doc.data()));
  }, error => {
    console.error("Error leyendo el ranking general:", error);
    $("#leaderboard-status").textContent = "No se pudo cargar el ranking general.";
  });
}

window.addEventListener("beforeunload", () => {
  if (unsubscribeLeaderboard) unsubscribeLeaderboard();
});

initLeaderboard();
