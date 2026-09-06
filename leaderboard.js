/*
  ======================================================================
  TABLA DE PUNTUACIONES — página independiente
  ======================================================================
  Lee el mismo localStorage que usa el juego (script.js), así que
  cualquier puntuación guardada desde index.html en este mismo
  dispositivo/navegador aparece aquí.
  ======================================================================
*/

const STORAGE_KEY = "adivinaCancion.leaderboard";

function $(selector) { return document.querySelector(selector); }

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
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

// Se actualiza sola si otra pestaña/ventana del mismo navegador guarda un
// puntaje nuevo (por ejemplo el juego abierto en otra pestaña).
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) renderLeaderboard();
});

// Respaldo: si esta página queda abierta fija en una pantalla grande,
// se refresca sola cada pocos segundos por si acaso.
setInterval(renderLeaderboard, 4000);

renderLeaderboard();
