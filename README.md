# Adivina la Canción — salas controladas por host

Esta actualización añade:

- salas independientes (`?room=3b`, `?room=casa-abierta`, etc.);
- `host.html` para que el profesor cree y controle cada sala;
- QR automático para que los estudiantes entren desde sus celulares;
- inicio de sala controlado por el host;
- cierre de sala para impedir nuevas partidas;
- marcador global en tiempo real;
- botón para reiniciar una sala y borrar todas sus puntuaciones;
- botón para eliminar una sala y todos sus datos desde el propio `host.html`.

## Archivos nuevos / actualizados

Sube o reemplaza en GitHub:

- `index.html`
- `script.js`
- `leaderboard.html`
- `leaderboard.js`
- `style.css`
- `songs.js`
- `host.html` **(nuevo)**
- `host.js` **(nuevo)**

Conserva tus carpetas actuales:

- `audio/`
- `images/`

### Importante sobre `firebase-config.js`

Este paquete incluye `firebase-config.example.js` solamente como ejemplo. **No reemplaces tu `firebase-config.js` si ya pegaste allí los datos reales de Firebase.**

Si todavía no lo has configurado, copia `firebase-config.example.js` como `firebase-config.js` y sustituye los valores `PEGA_AQUI...` por los que Firebase te entrega al registrar la aplicación Web.

## Firebase obligatorio

1. Authentication > Sign-in method > activa **Anonymous / Anónimo**.
2. Crea Firestore Database.
3. Firestore > Rules: pega TODO el contenido de `firestore.rules.txt` y pulsa **Publicar**.
4. En Authentication > Settings > Authorized domains agrega tu dominio de GitHub Pages, por ejemplo `usuario.github.io`.

## Cómo usarlo el día del juego

Abre:

`https://TU-USUARIO.github.io/TU-REPO/host.html`

1. Escribe un nombre de sala, por ejemplo `3b`.
2. Pulsa **Crear / abrir sala**.
3. El host muestra un QR automáticamente.
4. Los estudiantes escanean el QR. Verán **Esperando a que el profesor inicie la sala**.
5. Cuando todos estén listos, pulsa **Iniciar sala**.
6. En ese momento los celulares se habilitan automáticamente y cada estudiante puede escribir su nombre, elegir artista y jugar a su ritmo.
7. Las puntuaciones aparecen en el marcador del host y en `leaderboard.html?room=3b`.

## Controles del host

### Iniciar sala
Cambia la sala de `waiting` a `open`. Los celulares conectados se habilitan en tiempo real.

### Cerrar sala
Impide que se inicien nuevas partidas. Los estudiantes que ya estaban jugando pueden terminar y guardar su puntuación.

### Reiniciar sala y borrar puntuaciones
Borra todos los documentos de `rooms/{sala}/scores` y devuelve la sala a estado **En espera**. Es la opción ideal para empezar una nueva ronda con la misma sala y el mismo QR.

### Eliminar sala y todos sus datos
Borra primero todas las puntuaciones y después elimina el documento de la sala. Para evitar errores, pide escribir el nombre exacto de la sala antes de eliminar.

Por tanto, **ya no necesitas entrar manualmente a Firestore para borrar los resultados**. Puedes hacerlo desde `host.html`. Firestore queda como respaldo por si alguna vez necesitas revisar o borrar algo manualmente.

## Propiedad de la sala

El host inicia sesión en Firebase de forma anónima y la sala guarda el UID de ese navegador. Solo ese UID puede iniciar, cerrar, reiniciar o eliminar la sala según las reglas de Firestore.

Por eso conviene usar **el mismo navegador y dispositivo del host** durante la actividad. Si borras los datos del navegador o intentas administrar esa sala desde otro dispositivo, Firebase lo verá como otro usuario y no permitirá controlarla. En ese caso todavía puedes eliminar manualmente la sala desde Firebase Console.

## Estructura en Firestore

Ejemplo:

```text
rooms
└── 3b
    ├── status: "open"
    ├── hostUid: "..."
    └── scores
        ├── UID-estudiante-1
        │   ├── name: "Mateo"
        │   ├── artist: "Tainy"
        │   └── score: 720
        └── UID-estudiante-2
            ├── name: "Sofía"
            ├── artist: "De La Rose"
            └── score: 850
```

Cada teléfono conserva solo su mejor puntuación en esa sala.
