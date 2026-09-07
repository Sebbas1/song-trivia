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


  ======================================================================
*/

const SONG_CATEGORIES = [
  {
    id: "tainy",
    name: "Tainy",
    image: "images/tainy.jpg",
    songs: [
      {
        title: "Monstruo",
        audio: "audio/tainy1.mp3",
        options: ["Tema Falso A", "Tema Falso B", "Tema Falso C"]
      },
      {
        title: "mojabi ghost",
        audio: "audio/tainy2.mp3",
        options: ["Tema Falso D", "Tema Falso E", "Tema Falso F"]
      },
      {
        title: "a mi tambien",
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
        title: "kyoto",
        audio: "audio/delarose1.mp3",
        options: ["Tema Falso J", "Tema Falso K", "Tema Falso L"]
      },
      {
        title: "aurora",
        audio: "audio/delarose2.mp3",
        options: ["Tema Falso M", "Tema Falso N", "Tema Falso O"]
      },
      {
        title: "yo te conozco",
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
        title: "UNA NOTI",
        audio: "audio/omarcourtz1.mp3",
        options: ["Tema Falso S", "Tema Falso T", "Tema Falso U"]
      },
      {
        title: "KOKO",
        audio: "audio/omarcourtz2.mp3",
        options: ["Tema Falso V", "Tema Falso W", "Tema Falso X"]
      },
      {
        title: "Kyoto",
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
