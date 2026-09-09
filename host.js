/* CONTROL DEL PROFESOR / HOST */
let hostUser = null;
let activeRoomId = null;
let activeRoomRef = null;
let unsubscribeRoom = null;
let unsubscribeScores = null;

function $(selector) { return document.querySelector(selector); }
function sanitizeRoomId(raw) {
  return String(raw || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}
function setStatus(message, type = "") {
  const el = $("#host-status");
  el.textContent = message;
  el.dataset.type = type;
}
function setBusy(isBusy) {
  ["#btn-open-room", "#btn-start-room", "#btn-close-room", "#btn-reset-room", "#btn-delete-room"].forEach(sel => {
    const el = $(sel);
    if (el) el.disabled = isBusy;
  });
}

async function initHost() {
  const firebaseOk = await window.firebaseReady;
  hostUser = firebase.auth().currentUser;
  if (!firebaseOk || !window.gameDb || !hostUser) {
    setStatus("Firebase no está configurado. Completa firebase-config.js y activa Authentication anónimo.", "error");
    $("#btn-open-room").disabled = true;
    return;
  }
  setStatus("Firebase conectado. Escribe el nombre de una sala para crearla o volver a abrirla.", "ok");
  const roomFromUrl = sanitizeRoomId(new URLSearchParams(location.search).get("room"));
  if (roomFromUrl) {
    $("#host-room-id").value = roomFromUrl;
    openOrCreateRoom();
  }
}

async function openOrCreateRoom() {
  const roomId = sanitizeRoomId($("#host-room-id").value);
  if (!roomId) {
    setStatus("Escribe un nombre de sala válido.", "error");
    $("#host-room-id").focus();
    return;
  }

  setBusy(true);
  setStatus("Abriendo sala…");
  const ref = window.gameDb.collection("rooms").doc(roomId);

  try {
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      await ref.set({
        name: roomId,
        status: "waiting",
        hostUid: hostUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else if (snapshot.data().hostUid !== hostUser.uid) {
      throw new Error("Esta sala ya existe y pertenece a otro navegador/host.");
    }

    attachRoom(roomId, ref);
    setStatus(`Sala “${roomId}” lista. Proyecta el QR y pulsa “Iniciar sala” cuando quieras comenzar.`, "ok");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo abrir la sala.", "error");
  } finally {
    setBusy(false);
  }
}

function attachRoom(roomId, ref) {
  if (unsubscribeRoom) unsubscribeRoom();
  if (unsubscribeScores) unsubscribeScores();

  activeRoomId = roomId;
  activeRoomRef = ref;
  $("#host-room-panel").hidden = false;
  $("#host-room-name").textContent = roomId;

  const studentUrl = new URL("index.html", window.location.href);
  studentUrl.search = "";
  studentUrl.hash = "";
  studentUrl.searchParams.set("room", roomId);
  $("#student-url").value = studentUrl.href;

  const boardUrl = new URL("leaderboard.html", window.location.href);
  boardUrl.search = "";
  boardUrl.hash = "";
  boardUrl.searchParams.set("room", roomId);
  $("#host-public-board").href = boardUrl.href;

  const hostUrl = new URL("host.html", window.location.href);
  hostUrl.search = "";
  hostUrl.searchParams.set("room", roomId);
  history.replaceState({}, "", hostUrl.href);

  renderQr(studentUrl.href);

  unsubscribeRoom = ref.onSnapshot(snapshot => {
    if (!snapshot.exists) {
      clearRoomUi();
      return;
    }
    renderRoomState(snapshot.data().status || "waiting");
  });

  unsubscribeScores = ref.collection("scores").orderBy("score", "desc").limit(100)
    .onSnapshot(snapshot => renderHostLeaderboard(snapshot.docs.map(doc => doc.data())), error => {
      console.error(error);
      setStatus("La sala está abierta, pero no se pudo cargar el marcador.", "error");
    });
}

function renderQr(url) {
  const box = $("#qr-code");
  box.innerHTML = "";
  if (window.QRCode) {
    new QRCode(box, { text: url, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
  } else {
    box.textContent = "No se pudo cargar el generador QR. Usa el enlace de abajo.";
  }
}

function renderRoomState(status) {
  const badge = $("#host-room-state");
  badge.className = `room-state ${status}`;
  if (status === "open") {
    badge.textContent = "Abierta";
    $("#host-control-note").textContent = "La sala está abierta: los estudiantes ya pueden comenzar a jugar.";
  } else if (status === "closed") {
    badge.textContent = "Cerrada";
    $("#host-control-note").textContent = "La sala está cerrada: no se pueden iniciar nuevas partidas, pero las que ya estaban en curso pueden terminar y guardar su puntuación.";
  } else {
    badge.textContent = "En espera";
    $("#host-control-note").textContent = "Los estudiantes pueden abrir el enlace, pero deben esperar a que tú inicies la sala.";
  }
}

function renderHostLeaderboard(board) {
  const list = $("#host-leaderboard-list");
  list.innerHTML = "";
  if (!board.length) {
    list.innerHTML = '<li class="leaderboard-empty" style="justify-content:center;">Todavía no hay puntuaciones.</li>';
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

async function updateRoomStatus(status) {
  if (!activeRoomRef) return;
  setBusy(true);
  try {
    const payload = { status };
    if (status === "open") {
      payload.startedAt = firebase.firestore.FieldValue.serverTimestamp();
      payload.closedAt = firebase.firestore.FieldValue.delete();
    }
    if (status === "closed") {
      payload.closedAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    await activeRoomRef.update(payload);
    setStatus(status === "open" ? "Sala iniciada." : "Sala cerrada.", "ok");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo cambiar el estado de la sala.", "error");
  } finally {
    setBusy(false);
  }
}

async function deleteAllScores() {
  if (!activeRoomRef) return 0;
  let deleted = 0;
  while (true) {
    const snapshot = await activeRoomRef.collection("scores").limit(400).get();
    if (snapshot.empty) break;
    const batch = window.gameDb.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
  }
  return deleted;
}

async function resetRoom() {
  if (!activeRoomRef) return;
  const ok = confirm("¿Reiniciar la sala? Se borrarán TODAS las puntuaciones y volverá a estado de espera.");
  if (!ok) return;
  setBusy(true);
  setStatus("Borrando puntuaciones…");
  try {
    const deleted = await deleteAllScores();
    await activeRoomRef.update({
      status: "waiting",
      startedAt: firebase.firestore.FieldValue.delete(),
      closedAt: firebase.firestore.FieldValue.delete()
    });
    setStatus(`Sala reiniciada. Se eliminaron ${deleted} puntuaciones.`, "ok");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo reiniciar la sala.", "error");
  } finally {
    setBusy(false);
  }
}

async function deleteRoom() {
  if (!activeRoomRef) return;
  const typed = prompt(`Para eliminar la sala “${activeRoomId}” y todas sus puntuaciones, escribe exactamente: ${activeRoomId}`);
  if (typed !== activeRoomId) {
    if (typed !== null) setStatus("El nombre no coincide. La sala no se eliminó.", "error");
    return;
  }
  setBusy(true);
  setStatus("Eliminando sala y puntuaciones…");
  try {
    await deleteAllScores();
    await activeRoomRef.delete();
    setStatus("Sala eliminada por completo.", "ok");
    clearRoomUi();
  } catch (error) {
    console.error(error);
    setStatus("No se pudo eliminar la sala.", "error");
  } finally {
    setBusy(false);
  }
}

function clearRoomUi() {
  if (unsubscribeRoom) { unsubscribeRoom(); unsubscribeRoom = null; }
  if (unsubscribeScores) { unsubscribeScores(); unsubscribeScores = null; }
  activeRoomId = null;
  activeRoomRef = null;
  $("#host-room-panel").hidden = true;
  history.replaceState({}, "", new URL("host.html", window.location.href).href);
}

async function copyStudentLink() {
  const input = $("#student-url");
  try {
    await navigator.clipboard.writeText(input.value);
    setStatus("Enlace copiado.", "ok");
  } catch (_) {
    input.select();
    document.execCommand("copy");
    input.setSelectionRange(0, 0);
    setStatus("Enlace copiado.", "ok");
  }
}

$("#btn-open-room").addEventListener("click", openOrCreateRoom);
$("#host-room-id").addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); openOrCreateRoom(); }
});
$("#btn-copy-link").addEventListener("click", copyStudentLink);
$("#btn-start-room").addEventListener("click", () => updateRoomStatus("open"));
$("#btn-close-room").addEventListener("click", () => updateRoomStatus("closed"));
$("#btn-reset-room").addEventListener("click", resetRoom);
$("#btn-delete-room").addEventListener("click", deleteRoom);

window.addEventListener("beforeunload", () => {
  if (unsubscribeRoom) unsubscribeRoom();
  if (unsubscribeScores) unsubscribeScores();
});

initHost();
