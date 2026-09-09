# Adivina la Canción — versión multicelular

Esta versión permite que cada estudiante juegue desde su propio celular, a su ritmo, y que todos alimenten un mismo ranking de la sala mediante Firebase Firestore.

## 1. Mantén tus carpetas actuales

Conserva tus carpetas:

- `audio/`
- `images/`

Reemplaza los archivos principales por los de este paquete.

## 2. Configura Firebase

1. Entra a Firebase Console y crea un proyecto.
2. Agrega una aplicación Web.
3. Activa **Authentication > Sign-in method > Anonymous**.
4. Crea **Cloud Firestore**.
5. Copia el objeto `firebaseConfig` que entrega Firebase dentro de `firebase-config.js`.
6. En Firestore > Rules, pega el contenido de `firestore.rules.txt` y publica las reglas.

## 3. Publica el sitio

Necesitas una URL pública HTTPS. Puedes usar Firebase Hosting, Netlify o GitHub Pages.

Ejemplo:

`https://tusitio.com/index.html?room=3b`

Todos los estudiantes que entren con el mismo `room` comparten el mismo ranking. Para otra clase, usa otro nombre:

`?room=3a`
`?room=3b`
`?room=casa-abierta`

Genera el QR usando la URL completa de esa sala.

## 4. Canciones: ya no necesitas escribir tres opciones falsas

El juego toma automáticamente otras canciones del mismo artista como respuestas incorrectas. Por eso cada artista debería tener idealmente al menos 4 canciones.

Cada canción puede quedar así:

```js
{
  title: "Nombre de la canción",
  audio: "audio/archivo.mp3"
}
```

Los `options` antiguos siguen funcionando, así que no es obligatorio borrar los que ya tienes.

## 5. Reproducir desde un punto concreto sin recortar el MP3

También puedes añadir `start` en segundos:

```js
{
  title: "Nombre de la canción",
  audio: "audio/archivo.mp3",
  start: 42
}
```

La pregunta comenzará aproximadamente en el segundo 42 y el temporizador del juego la detendrá al pasar a la siguiente pregunta.

## 6. Sobre Spotify

No se recomienda usar Spotify como fuente directa del audio del juego. Su API puede servir para buscar metadatos, pero los previews de 30 segundos están marcados como obsoletos y pueden venir vacíos. El Web Playback SDK requiere autenticación y Spotify Premium, lo que complica mucho un juego donde cada estudiante participa desde su propio celular.

Para este proyecto, lo más estable es mantener los audios autorizados/locales y usar `start` para elegir el fragmento sin editar cada archivo.
