/*
  ======================================================================
  BANCO DE CANCIONES
  ======================================================================
  Aquí defines las categorías y las canciones de tu juego.

  Cada canción necesita:
    - title:  el nombre correcto de la canción (la respuesta correcta)
    - artist: el artista (se muestra en resultados, opcional)
    - audio:  la ruta al archivo de audio dentro de la carpeta /audio
    - options: 3 opciones falsas (distractores). El programa mezcla
               automáticamente la respuesta correcta entre ellas.

  IMPORTANTE SOBRE EL AUDIO:
  Por derechos de autor, este proyecto no incluye canciones reales.
  Debes agregar tú mismo los archivos .mp3 (fragmentos cortos, 10-20s)
  dentro de la carpeta "audio/" y escribir aquí el nombre exacto del
  archivo. Puedes usar tus propias grabaciones, canciones libres de
  derechos, o clips que tengas permiso de usar en tu casa abierta.

  Puedes agregar tantas categorías y canciones como quieras copiando
  el mismo patrón.
  ======================================================================
*/

const SONG_CATEGORIES = [
  {
    id: "pop",
    name: "Pop",
    icon: "🎤",
    songs: [
      {
        title: "Ejemplo Canción 1",
        artist: "Artista Ejemplo",
        audio: "audio/cancion1.mp3",
        options: ["Otra Canción", "Tema Falso", "Canción Distinta"]
      },
      {
        title: "Ejemplo Canción 2",
        artist: "Artista Ejemplo",
        audio: "audio/cancion2.mp3",
        options: ["Canción X", "Canción Y", "Canción Z"]
      },
      {
        title: "Ejemplo Canción 3",
        artist: "Artista Ejemplo",
        audio: "audio/cancion3.mp3",
        options: ["Sencillo A", "Sencillo B", "Sencillo C"]
      },
      {
        title: "Ejemplo Canción 4",
        artist: "Artista Ejemplo",
        audio: "audio/cancion4.mp3",
        options: ["Tema Uno", "Tema Dos", "Tema Tres"]
      }
    ]
  },
  {
    id: "rock",
    name: "Rock",
    icon: "🎸",
    songs: [
      {
        title: "Ejemplo Rock 1",
        artist: "Banda Ejemplo",
        audio: "audio/rock1.mp3",
        options: ["Rock Falso A", "Rock Falso B", "Rock Falso C"]
      },
      {
        title: "Ejemplo Rock 2",
        artist: "Banda Ejemplo",
        audio: "audio/rock2.mp3",
        options: ["Canción D", "Canción E", "Canción F"]
      }
    ]
  },
  {
    id: "latino",
    name: "Latino",
    icon: "💃",
    songs: [
      {
        title: "Ejemplo Latino 1",
        artist: "Artista Ejemplo",
        audio: "audio/latino1.mp3",
        options: ["Tema G", "Tema H", "Tema I"]
      },
      {
        title: "Ejemplo Latino 2",
        artist: "Artista Ejemplo",
        audio: "audio/latino2.mp3",
        options: ["Tema J", "Tema K", "Tema L"]
      }
    ]
  }
];

// Cuántas rondas juega cada partida como máximo (si la categoría tiene menos
// canciones que este número, se usan todas las que haya).
const ROUNDS_PER_GAME = 8;

// Segundos por pregunta.
const SECONDS_PER_QUESTION = 15;

// Puntos base por acierto + bono por velocidad (segundos restantes x este valor).
const BASE_POINTS = 100;
const SPEED_BONUS_PER_SECOND = 10;
