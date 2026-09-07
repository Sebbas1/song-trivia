# Adivina la Canción — Proyecto de Casa Abierta

Juego de adivinanza musical con nombre de jugador, temporizador, puntuación
y una tabla de mejores puntuaciones guardada en el navegador (localStorage),
para que la puntuación más alta de cada nombre se conserve entre partidas.

## Estructura del proyecto

```
song-trivia/
├── index.html          → el juego
├── leaderboard.html     → tabla de puntuaciones (URL aparte)
├── style.css              → estilos
├── script.js               → lógica del juego
├── leaderboard.js            → lógica de la tabla de puntuaciones
├── songs.js                   → AQUÍ agregas tus artistas y canciones
├── images/                      → coloca aquí las fotos de los artistas
└── audio/                        → coloca aquí tus archivos .mp3
```

Como el juego se juega desde **un solo dispositivo** (la tablet o
computadora que ustedes den), los puntajes se guardan en el propio
navegador (`localStorage`) — no depende de internet ni de servicios
externos, y no requiere ninguna configuración adicional.

## Cómo agregar la foto de cada artista

1. Descarga una foto de perfil o promocional del artista (idealmente
   cuadrada, unos 300x300px funciona bien).
2. Guárdala dentro de la carpeta `images/` con el nombre que indicaste
   en `songs.js` (por ejemplo `images/tainy.jpg`).
3. Si el archivo no aparece, la tarjeta simplemente se ve con un círculo
   vacío del color de fondo — revisa que el nombre coincida exactamente
   (mayúsculas/minúsculas incluidas).

## Cómo correrlo en localhost

**Opción rápida:** haz doble clic en `index.html` para abrirlo directamente
en el navegador.

**Opción recomendada:** levanta un servidor local desde la carpeta del
proyecto (más fiel a como se comporta ya publicado):
```
cd song-trivia
python -m http.server 8000
```
Luego abre en el navegador: `http://localhost:8000`

Con Node.js, si lo tienes instalado:
```
cd song-trivia
npx serve .
```

## Cómo agregar tus propias canciones

1. Abre `songs.js`.
2. Cada categoría tiene una lista `songs`. Copia el patrón de un ejemplo
   y reemplaza:
   - `title`: el nombre real de la canción (será la respuesta correcta).
   - `artist`: el artista (opcional, solo informativo).
   - `audio`: el nombre del archivo dentro de la carpeta `audio/`.
   - `options`: tres nombres falsos de canciones (los distractores).
3. Copia el archivo de audio correspondiente (un fragmento corto, de
   10 a 20 segundos, en formato `.mp3`) dentro de la carpeta `audio/`.
4. Puedes agregar tantas categorías nuevas como quieras copiando el
   bloque `{ id, name, icon, songs: [...] }`.

**Nota sobre derechos de autor:** este proyecto no incluye canciones reales
por temas de derechos de autor. Usa grabaciones propias, música libre de
derechos, o clips que tengas autorización de usar en tu evento.

## Cómo funciona la tabla de puntuaciones

- Al terminar una partida, el puntaje se guarda automáticamente — no hay
  que presionar ningún botón.
- Se guarda por nombre: si el mismo nombre juega varias veces, solo se
  conserva su mejor puntuación.
- Los datos quedan en el navegador de ese dispositivo (`localStorage`),
  así que persisten aunque se cierre la pestaña o se apague el equipo —
  pero son propios de ese navegador/dispositivo específico.
- En `leaderboard.html`, cada fila tiene un botón "×" para eliminar a
  un participante específico de la tabla, uno por uno.

## Ajustes rápidos

En `songs.js` también puedes cambiar:
- `ROUNDS_PER_GAME`: cuántas canciones tiene cada partida.
- `SECONDS_PER_QUESTION`: tiempo por pregunta.
- `BASE_POINTS` y `SPEED_BONUS_PER_SECOND`: cómo se calculan los puntos.
