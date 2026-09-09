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
        
      },
      {
        title: "Mojabi ghost",
        audio: "audio/tainy2.mp3",
        
      },
      {
        title: "a mi tambien",
        audio: "audio/tainy3.mp3",
        
      },
      {
        title: "PASIEMPRE",
        audio: "audio/tainy4.mp3",
        start: 48
      },
      {
        title: "COLMILLO",
        audio: "audio/tainy5.mp3",
        start: 50
      },
      {
       title: "Sci-Fi",
       audio: "audio/tainy6.mp3",
       start: 35
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
       
      },
      {
        title: "aurora",
        audio: "audio/delarose2.mp3",
        
      },
      {
        title: "yo te conozco",
        audio: "audio/delarose3.mp3",
        
      },
      {
        title: "Q U E V A S H A C E R H O Y ?",
        audio: "audio/delarose4.mp3",
        start: 44
      },
      {
        title: "NUBES",
        audio: "audio/delarose5.mp3",
        start: 34
     },
     {
       title: "444 - Remix",
       audio: "audio/delarose6.mp3",
       start: 81
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
      },
      {
        title: "VeLDÁ",
        audio: "audio/omarcourtz4.mp3",
        start: 138
      },
      {
       title: "LUCES DE COLORES",
       audio: "audio/omarcourtz5.mp3",
       start: 30
     },
     {
       title: "De Lejitos - Remix",
       audio: "audio/omarcourtz6.mp3",
       start: 67
}
    ]
  }
];

// Cuántas rondas juega cada partida como máximo (si el artista tiene menos
// canciones que este número, se usan todas las que haya).
const ROUNDS_PER_GAME = 5;

// Segundos por pregunta.
const SECONDS_PER_QUESTION = 15;

// Puntos base por acierto + bono por velocidad (segundos restantes x este valor).
const BASE_POINTS = 100;
const SPEED_BONUS_PER_SECOND = 10;
