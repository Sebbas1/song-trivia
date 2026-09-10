/*
  CONTROL DEL PROFESOR / HOST
  - Login visible: usuario "root"
  - Firebase Auth interno: root@adivina.local
  - Un único QR permanente apunta a index.html
  - /system/current guarda qué sala debe abrir el QR permanente
  - Las puntuaciones siguen siendo globales en /scores
*/

const HOST_USERNAME = "root";
const HOST_EMAIL = "root@adivina.local";

let hostUser = null;
let activeRoomId = null;
let activeRoomRef = null;
let activeRoomStatus = "waiting";
let unsubscribeRoom = null;
let unsubscribeScores = null;
let controlsInitialized = false;

function $(selector) { return document.querySelector(selector); }

function sanitizeRoomId(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

function showHostControl(showControl) {
  $("#host-login-screen").classList.toggle("active", !showControl);
  $("#host-control-screen").classList.toggle("active", showControl);
}

function setLoginStatus(message, type = "") {
  const el = $("#host-login-status");
  el.textContent = message;
  el.dataset.type = type;
}

function setStatus(message, type = "") {
  const el = $("#host-status");
  el.textContent = message;
  el.dataset.type = type;
}

function setBusy(isBusy) {
  [
    "#btn-open-room",
    "#btn-start-room",
    "#btn-close-room",
    "#btn-reset-room",
    "#btn-delete-room",
    "#btn-delete-global-scores"
  ].forEach(selector => {
    const el = $(selector);
    if (el) el.disabled = isBusy;
  });
}

function currentRoomDoc() {
  return window.gameDb.collection("system").doc("current");
}

async function bootstrapLogin() {
  const firebaseOk = await window.firebaseReady;

  if (!firebaseOk || !window.gameDb) {
    setLoginStatus("Firebase no está conectado. Revisa firebase-config.js.", "error");
    $("#btn-host-login").disabled = true;
    return;
  }

  setLoginStatus("", "");
  $("#host-username").focus();
}

async function loginHost(event) {
  event.preventDefault();

  const username = $("#host-username").value.trim();
  const password = $("#host-password").value;

  if (username !== HOST_USERNAME || !password) {
    setLoginStatus("Usuario o contraseña incorrectos.", "error");
    return;
  }

  const button = $("#btn-host-login");
  button.disabled = true;
  setLoginStatus("Verificando acceso…");

  try {
    const result = await firebase.auth().signInWithEmailAndPassword(HOST_EMAIL, password);
    const user = result.user;

    if (!user || String(user.email || "").toLowerCase() !== HOST_EMAIL) {
      throw new Error("Cuenta de host no autorizada.");
    }

    hostUser = user;
    $("#host-password").value = "";
    setLoginStatus("", "");
    showHostControl(true);
    await initHostControls();
  } catch (error) {
    console.error("Error de acceso del host:", error);
    setLoginStatus("Usuario o contraseña incorrectos, o la cuenta del host aún no existe en Firebase.", "error");
  } finally {
    button.disabled = false;
  }
}

async function logoutHost() {
  try {
    if (unsubscribeRoom) unsubscribeRoom();
    if (unsubscribeScores) unsubscribeScores();
    await firebase.auth().signOut();
  } catch (error) {
    console.warn("No se pudo cerrar la sesión limpiamente:", error);
  }
  window.location.href = new URL("host.html", window.location.href).href;
}

async function initHostControls() {
  if (!hostUser || !window.gameDb) return;

  if (!controlsInitialized) {
    controlsInitialized = true;
    subscribeGlobalRanking();
  }

  setStatus("Acceso autorizado. Selecciona una sala o continúa con la sala activa.", "ok");

  try {
    const roomFromUrl = sanitizeRoomId(new URLSearchParams(location.search).get("room"));
    const currentSnapshot = await currentRoomDoc().get();
    const currentRoomId = currentSnapshot.exists
      ? sanitizeRoomId(currentSnapshot.data().roomId)
      : "";

    const roomToOpen = roomFromUrl || currentRoomId;
    if (roomToOpen) {
      $("#host-room-id").value = roomToOpen;
      await openOrCreateRoom({ userSwitch: false });
    } else {
      setStatus("No hay una sala activa todavía. Escribe un nombre y pulsa “Cambiar / crear sala”.", "ok");
    }
  } catch (error) {
    console.error(error);
    setStatus("No se pudo consultar la sala activa.", "error");
  }
}

async function closePreviousRoomIfNeeded(nextRoomId) {
  if (!activeRoomRef || !activeRoomId || activeRoomId === nextRoomId) return;

  try {
    await activeRoomRef.update({
      status: "closed",
      closedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.warn("No se pudo cerrar automáticamente la sala anterior:", error);
  }
}

async function claimOrPrepareRoom(ref, roomId, userSwitch) {
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    await ref.set({
      name: roomId,
      status: "waiting",
      hostUid: hostUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return;
  }

  const data = snapshot.data();
  const updates = {};

  // El usuario root puede recuperar salas antiguas creadas con el host anónimo.
  if (data.hostUid !== hostUser.uid) {
    updates.hostUid = hostUser.uid;
  }

  // Cuando el usuario cambia de sala desde el host, la sala destino queda en espera.
  if (userSwitch && roomId !== activeRoomId) {
    updates.status = "waiting";
    updates.startedAt = firebase.firestore.FieldValue.delete();
    updates.closedAt = firebase.firestore.FieldValue.delete();
  }

  if (Object.keys(updates).length) {
    await ref.update(updates);
  }
}

async function setCurrentRoom(roomId) {
  await currentRoomDoc().set({
    roomId,
    roomName: roomId,
    hostUid: hostUser.uid,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function openOrCreateRoom(options = {}) {
  const userSwitch = options.userSwitch !== false;
  const roomId = sanitizeRoomId($("#host-room-id").value);

  if (!roomId) {
    setStatus("Escribe un nombre de sala válido.", "error");
    $("#host-room-id").focus();
    return;
  }

  setBusy(true);
  setStatus(userSwitch ? "Cambiando sala…" : "Abriendo sala…");

  const ref = window.gameDb.collection("rooms").doc(roomId);

  try {
    if (userSwitch) {
      await closePreviousRoomIfNeeded(roomId);
    }

    await claimOrPrepareRoom(ref, roomId, userSwitch);
    await setCurrentRoom(roomId);
    attachRoom(roomId, ref);

    setStatus(
      userSwitch
        ? `Sala “${roomId}” seleccionada. El QR permanente ya dirige a esta sala.`
        : `Sala “${roomId}” cargada.`,
      "ok"
    );
  } catch (error) {
    console.error(error);
    setStatus(error.message || "No se pudo abrir la sala.", "error");
  } finally {
    setBusy(false);
  }
}

function attachRoom(roomId, ref) {
  if (unsubscribeRoom) unsubscribeRoom();

  activeRoomId = roomId;
  activeRoomRef = ref;
  $("#host-room-panel").hidden = false;
  $("#host-room-name").textContent = roomId;
  $("#qr-current-room").textContent = roomId;

  // QR PERMANENTE: NO incluye ?room=...
  // index.html consultará /system/current y sabrá qué sala debe usar.
  const studentUrl = new URL("index.html", window.location.href);
  studentUrl.search = "";
  studentUrl.hash = "";
  $("#student-url").value = studentUrl.href;
  renderQr(studentUrl.href);

  const boardUrl = new URL("leaderboard.html", window.location.href);
  boardUrl.search = "";
  boardUrl.hash = "";
  $("#host-public-board").href = boardUrl.href;

  const hostUrl = new URL("host.html", window.location.href);
  hostUrl.search = "";
  hostUrl.searchParams.set("room", roomId);
  history.replaceState({}, "", hostUrl.href);

  unsubscribeRoom = ref.onSnapshot(snapshot => {
    if (!snapshot.exists) {
      clearRoomUi();
      return;
    }

    const room = snapshot.data();
    activeRoomStatus = room.status || "waiting";
    renderRoomState(activeRoomStatus);
  }, error => {
    console.error(error);
    setStatus("No se pudo escuchar el estado de la sala.", "error");
  });
}

function subscribeGlobalRanking() {
  if (unsubscribeScores) unsubscribeScores();

  unsubscribeScores = window.gameDb.collection("scores")
    .orderBy("score", "desc")
    .limit(100)
    .onSnapshot(
      snapshot => renderHostLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      error => {
        console.error(error);
        setStatus("No se pudo cargar el ranking general.", "error");
      }
    );
}

function renderQr(url) {
  const box = $("#qr-code");
  box.innerHTML = "";

  if (window.QRCode) {
    new QRCode(box, {
      text: url,
      width: 220,
      height: 220,
      correctLevel: QRCode.CorrectLevel.M
    });
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
    $("#host-control-note").textContent = "Los estudiantes pueden escanear el QR permanente, pero deben esperar a que tú inicies la sala.";
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
    const roomText = entry.room && entry.room !== "general"
      ? `Sala ${entry.room}`
      : "Sala general";

    li.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="lb-name">${escapeHtml(entry.name)}<small class="lb-artist">${escapeHtml(entry.artist || "")} · ${escapeHtml(roomText)}</small></span>
      <span class="lb-score">${Number(entry.score || 0)} pts</span>
      <button class="btn-delete-entry" type="button" title="Eliminar a ${escapeHtml(entry.name)}" aria-label="Eliminar a ${escapeHtml(entry.name)} del ranking">&times;</button>
    `;

    li.querySelector(".btn-delete-entry").addEventListener("click", () => deleteParticipantScore(entry));
    list.appendChild(li);
  });
}

async function deleteParticipantScore(entry) {
  if (!hostUser || !entry?.id) return;

  const ok = confirm(
    `¿Eliminar a “${entry.name || "este participante"}” del ranking general?\n\n` +
    `Se borrará únicamente su puntuación. Las demás permanecerán intactas.`
  );
  if (!ok) return;

  setStatus(`Eliminando a ${entry.name || "participante"}…`);

  try {
    await window.gameDb.collection("scores").doc(entry.id).delete();
    setStatus(`Se eliminó a ${entry.name || "el participante"} del ranking general.`, "ok");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo eliminar esa puntuación. Revisa las reglas de Firestore.", "error");
  }
}

async function updateRoomStatus(status) {
  if (!activeRoomRef) return;

  setBusy(true);

  try {
    const payload = {
      status,
      hostUid: hostUser.uid
    };

    if (status === "open") {
      payload.startedAt = firebase.firestore.FieldValue.serverTimestamp();
      payload.closedAt = firebase.firestore.FieldValue.delete();
      await setCurrentRoom(activeRoomId);
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

async function resetRoom() {
  if (!activeRoomRef) return;

  const ok = confirm("¿Reiniciar esta sala? Volverá a estado de espera. El ranking general NO se borrará.");
  if (!ok) return;

  setBusy(true);

  try {
    await activeRoomRef.update({
      status: "waiting",
      hostUid: hostUser.uid,
      startedAt: firebase.firestore.FieldValue.delete(),
      closedAt: firebase.firestore.FieldValue.delete()
    });
    await setCurrentRoom(activeRoomId);
    setStatus("Sala reiniciada. El QR permanente sigue apuntando a esta sala y las puntuaciones se conservan.", "ok");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo reiniciar la sala.", "error");
  } finally {
    setBusy(false);
  }
}

async function deleteRoom() {
  if (!activeRoomRef) return;

  const typed = prompt(
    `Para eliminar la sala “${activeRoomId}”, escribe exactamente: ${activeRoomId}\n\nLas puntuaciones del ranking general NO se eliminarán.`
  );

  if (typed !== activeRoomId) {
    if (typed !== null) setStatus("El nombre no coincide. La sala no se eliminó.", "error");
    return;
  }

  setBusy(true);
  setStatus("Eliminando sala…");

  try {
    const currentSnapshot = await currentRoomDoc().get();
    const currentId = currentSnapshot.exists
      ? sanitizeRoomId(currentSnapshot.data().roomId)
      : "";

    await activeRoomRef.delete();

    if (currentId === activeRoomId) {
      await currentRoomDoc().delete();
    }

    setStatus("Sala eliminada. El ranking general se conservó. El QR permanente quedará esperando hasta que selecciones otra sala.", "ok");
    clearRoomUi();
  } catch (error) {
    console.error(error);
    setStatus("No se pudo eliminar la sala.", "error");
  } finally {
    setBusy(false);
  }
}

async function deleteGlobalScores() {
  if (!hostUser) return;

  const first = confirm("¿Borrar TODO el ranking general? Esta acción elimina las mejores puntuaciones acumuladas de todas las salas.");
  if (!first) return;

  const typed = prompt("Escribe BORRAR para confirmar la eliminación del ranking general:");
  if (typed !== "BORRAR") {
    if (typed !== null) setStatus("Confirmación incorrecta. El ranking general no se borró.", "error");
    return;
  }

  setBusy(true);
  setStatus("Borrando ranking general…");
  let deleted = 0;

  try {
    while (true) {
      const snapshot = await window.gameDb.collection("scores").limit(400).get();
      if (snapshot.empty) break;

      const batch = window.gameDb.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deleted += snapshot.size;
    }

    setStatus(`Ranking general borrado. Se eliminaron ${deleted} puntuaciones.`, "ok");
  } catch (error) {
    console.error(error);
    setStatus("No se pudo borrar el ranking general. Revisa las reglas de Firestore.", "error");
  } finally {
    setBusy(false);
  }
}

function clearRoomUi() {
  if (unsubscribeRoom) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }

  activeRoomId = null;
  activeRoomRef = null;
  activeRoomStatus = "waiting";
  $("#host-room-panel").hidden = true;
  $("#qr-current-room").textContent = "—";
  history.replaceState({}, "", new URL("host.html", window.location.href).href);
}

async function copyStudentLink() {
  const input = $("#student-url");

  try {
    await navigator.clipboard.writeText(input.value);
    setStatus("Enlace permanente copiado.", "ok");
  } catch (_) {
    input.select();
    document.execCommand("copy");
    input.setSelectionRange(0, 0);
    setStatus("Enlace permanente copiado.", "ok");
  }
}

$("#host-login-form").addEventListener("submit", loginHost);
$("#btn-host-logout").addEventListener("click", logoutHost);

$("#btn-open-room").addEventListener("click", () => openOrCreateRoom({ userSwitch: true }));
$("#host-room-id").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    openOrCreateRoom({ userSwitch: true });
  }
});

$("#btn-copy-link").addEventListener("click", copyStudentLink);
$("#btn-start-room").addEventListener("click", () => updateRoomStatus("open"));
$("#btn-close-room").addEventListener("click", () => updateRoomStatus("closed"));
$("#btn-reset-room").addEventListener("click", resetRoom);
$("#btn-delete-room").addEventListener("click", deleteRoom);
$("#btn-delete-global-scores").addEventListener("click", deleteGlobalScores);

window.addEventListener("beforeunload", () => {
  if (unsubscribeRoom) unsubscribeRoom();
  if (unsubscribeScores) unsubscribeScores();
});

bootstrapLogin();
