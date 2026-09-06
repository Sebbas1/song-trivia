# Adivina la Canción — Proyecto de Casa Abierta

Juego de adivinanza musical con nombre de jugador, temporizador, puntuación
y una tabla de mejores puntuaciones guardada en el navegador (localStorage),
para que la puntuación más alta de cada nombre se conserve entre partidas.

## Estructura del proyecto

```
song-trivia/
├── index.html      → estructura de las pantallas
├── style.css        → estilos (tema oscuro con acentos dorados)
├── script.js         → lógica del juego y de la tabla de puntuaciones
├── songs.js           → AQUÍ agregas tus canciones y categorías
└── audio/              → coloca aquí tus archivos .mp3
```

## Cómo correrlo en localhost

**Opción rápida:** haz doble clic en `index.html` para abrirlo directamente
en el navegador. Funciona para la mayoría de los casos.

**Opción recomendada (evita problemas con el audio en algunos navegadores):**
levanta un servidor local desde la carpeta del proyecto.

Con Python (ya viene instalado en la mayoría de las computadoras):
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

- Al terminar una partida, el jugador puede presionar "Guardar puntuación".
- Se guarda por nombre: si el mismo nombre juega varias veces, solo se
  conserva su mejor puntuación.
- Los datos se guardan en `localStorage`, es decir, quedan almacenados en
  ese navegador/computadora aunque se cierre la pestaña o se apague el
  equipo. Si cambias de navegador o de computadora, la tabla empieza vacía.
- El botón "Borrar tabla de puntuaciones" (dentro de esa pantalla) borra
  todo el historial — útil para reiniciar antes del evento.

## Ajustes rápidos

En `songs.js` también puedes cambiar:
- `ROUNDS_PER_GAME`: cuántas canciones tiene cada partida.
- `SECONDS_PER_QUESTION`: tiempo por pregunta.
- `BASE_POINTS` y `SPEED_BONUS_PER_SECOND`: cómo se calculan los puntos.
