/*
  ======================================================================
  BANCO DE CANCIONES
  ======================================================================
  Aquí defines los artistas y las canciones de tu juego.

  Cada artista necesita:
    - id:    identificador corto, sin espacios (ej. "tainy")
    - name:  el nombre que se muestra debajo de la foto
    - image: la ruta a la foto dentro de la carpeta /images
    - songs: la lista de canciones de ese artista

  Cada canción necesita:
    - title:  el nombre correcto de la canción (la respuesta correcta)
    - audio:  la ruta al archivo de audio dentro de la carpeta /audio
    - options: 3 opciones falsas (distractores). El programa mezcla
               automáticamente la respuesta correcta entre ellas.

  IMPORTANTE SOBRE LAS FOTOS:
  Este proyecto no incluye fotos de los artistas. Descarga tú mismo una
  foto de cada uno (cuadrada funciona mejor, ej. 300x300px), guárdala
  dentro de la carpeta "images/" y escribe aquí el nombre exacto del
  archivo. Como es para un proyecto escolar de uso interno y no comercial,
  basta con una foto de perfil o promocional de cada artista.

  IMPORTANTE SOBRE EL AUDIO:
  Por derechos de autor, este proyecto tampoco incluye canciones reales.
  Agrega tú mismo los archivos .mp3 (fragmentos cortos, 10-20s) dentro
  de la carpeta "audio/".
  ======================================================================
*/

const SONG_CATEGORIES = [
  {
    id: "tainy",
    name: "Tainy",
    image: "images/tainy.jpg",
    songs: [
      {
        title: "Ejemplo Tainy 1",
        audio: "audio/tainy1.mp3",
        options: ["Tema Falso A", "Tema Falso B", "Tema Falso C"]
      },
      {
        title: "Ejemplo Tainy 2",
        audio: "audio/tainy2.mp3",
        options: ["Tema Falso D", "Tema Falso E", "Tema Falso F"]
      },
      {
        title: "Ejemplo Tainy 3",
        audio: "audio/tainy3.mp3",
        options: ["Tema Falso G", "Tema Falso H", "Tema Falso I"]
      }
    ]
  },
  {
    id: "delarose",
    name: "De La Rose",
    image: "images/delarose.jpg",
    songs: [
      {
        title: "Ejemplo De La Rose 1",
        audio: "audio/delarose1.mp3",
        options: ["Tema Falso J", "Tema Falso K", "Tema Falso L"]
      },
      {
        title: "Ejemplo De La Rose 2",
        audio: "audio/delarose2.mp3",
        options: ["Tema Falso M", "Tema Falso N", "Tema Falso O"]
      },
      {
        title: "Ejemplo De La Rose 3",
        audio: "audio/delarose3.mp3",
        options: ["Tema Falso P", "Tema Falso Q", "Tema Falso R"]
      }
    ]
  },
  {
    id: "omarcourtz",
    name: "Omar Courtz",
    image: "images/omarcourtz.jpg",
    songs: [
      {
        title: "Ejemplo Omar Courtz 1",
        audio: "audio/omarcourtz1.mp3",
        options: ["Tema Falso S", "Tema Falso T", "Tema Falso U"]
      },
      {
        title: "Ejemplo Omar Courtz 2",
        audio: "audio/omarcourtz2.mp3",
        options: ["Tema Falso V", "Tema Falso W", "Tema Falso X"]
      },
      {
        title: "Ejemplo Omar Courtz 3",
        audio: "audio/omarcourtz3.mp3",
        options: ["Tema Falso Y", "Tema Falso Z", "Tema Falso AA"]
      }
    ]
  }
];

// Cuántas rondas juega cada partida como máximo (si el artista tiene menos
// canciones que este número, se usan todas las que haya).
const ROUNDS_PER_GAME = 8;

// Segundos por pregunta.
const SECONDS_PER_QUESTION = 15;

// Puntos base por acierto + bono por velocidad (segundos restantes x este valor).
const BASE_POINTS = 100;
const SPEED_BONUS_PER_SECOND = 10;
