# FoodAI

App web para cocinar con lo que tienes en la nevera: escaneas tus ingredientes, te propone recetas que puedes hacer, te guía paso a paso con temporizador y lleva tu racha, tu nivel y tus macros.

Está hecha con **HTML, CSS y JavaScript sin frameworks** (módulos ES). No hay que instalar nada ni compilar: se abre con cualquier servidor local.

## Cómo arrancarla

### Opción A: desde la terminal

```bash
cd ~/foodIA
python3 -m http.server 8000
```

Abre **http://localhost:8000** en el navegador. Para pararlo: `Ctrl + C`.

> No abras `index.html` con doble clic: los módulos de JavaScript y la carga de `data/*.json` necesitan un servidor.

### Opción B: desde VS Code

1. Abre la carpeta: `code ~/foodIA` (o Archivo → Abrir carpeta).
2. Instala la extensión **Live Server**; VS Code te la sugerirá al abrir la carpeta.
3. Clic derecho en `index.html` → **Open with Live Server**. Se recarga sola cada vez que guardas.

### En el móvil

Con el móvil y el Mac en la misma red, por ejemplo con el punto de acceso del móvil:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
ipconfig getifaddr en0      # te da la IP, p. ej. 172.20.10.2
```

En el móvil abre `http://TU-IP:8000`. En Safari: Compartir → **Añadir a pantalla de inicio**.

En el móvil, el botón de la cámara abre la cámara de verdad. Desde una IP local (`http://`) el modo sin conexión no se activa; eso solo funciona en `localhost` o con `https`.

## Qué funciona ya

| Parte | Qué hace |
|---|---|
| **Nevera** | Añadir ingredientes a mano (nombre con autocompletado, cantidad, unidad, caducidad, categoría), sumar o restar cantidad, marcar básicos con estrella, borrar. Avisa de lo que caduca y de lo que se acaba. |
| **Escanear** | Hace la foto con la cámara o la coge de la galería. Muestra lo reconocido en una lista que puedes editar antes de añadirlo a la nevera. *El reconocimiento está en modo demo* (ver abajo). |
| **Sugerencias** | Recetas según tu nevera, tu dieta y tu nivel. Primero las que tienes completas y las que gastan lo que caduca antes. No repite lo que cocinaste ayer u hoy. |
| **Receta** | Ingredientes que tienes y que te faltan según las raciones, macros y botón para añadir lo que falta a la lista de la compra. |
| **Modo cocina** | Un paso por pantalla, temporizador con sonido y vibración, y pantalla siempre encendida. Al terminar descuenta las cantidades de la nevera (los básicos no), guarda la comida en el historial y suma puntos. |
| **Lista de la compra** | Añadir, tachar lo comprado y pasarlo a la nevera con un toque. Sugerencias según lo que se acaba, lo caducado y lo que falta para recetas que casi puedes hacer. |
| **Racha / calendario** | Calendario real por meses con lo que cocinaste cada día, racha actual y mejor racha. |
| **Descubrir** | Búsqueda por plato o ingrediente y filtros de proteína, carbohidratos, tiempo, nivel y "solo con lo que tengo". |
| **Favoritas** | Guardar recetas con el corazón. |
| **Perfil** | Nombre, nivel con su progreso, macros de hoy y de la semana, dieta (bloquea recetas con carne o con productos animales), objetivo y activar o desactivar el contador de macros. |
| **Tus datos** | Todo se guarda en el navegador (`localStorage`). Puedes descargar una copia, restaurarla, cargar datos de demo o borrarlo todo. |
| **PWA** | Se puede instalar como app y abre sin conexión cuando funciona en `localhost` o `https`. |

## Estructura del proyecto

```
foodIA/
├── index.html              ← página única; carga css y js/main.js
├── manifest.webmanifest    ← datos para instalarla como app
├── sw.js                   ← service worker (modo sin conexión)
├── assets/                 ← iconos
├── css/styles.css          ← todos los estilos
├── data/
│   ├── recipes.json        ← RECETAS: añade aquí las nuevas
│   └── ingredients.json    ← catálogo de ingredientes (categoría, unidad, tipo, duración)
├── js/
│   ├── main.js             ← arranque, eventos y elección de pantalla
│   ├── config.js           ← AJUSTES (URL del reconocimiento, puntos…)
│   ├── store.js            ← estado: `data` (se guarda) y `ui` (temporal)
│   ├── router.js           ← rutas con # (#/fridge, #/recipe/id…)
│   ├── lib/                ← utilidades: fechas, textos, eventos
│   ├── domain/             ← LÓGICA sin HTML: nevera, recetas, estadísticas, demo
│   ├── services/recognition.js ← reconocimiento de la foto
│   ├── ui/                 ← iconos y componentes que se repiten (tarjeta, cabecera…)
│   └── views/              ← una pantalla por archivo
└── prototype/index.html    ← el prototipo anterior, por si lo necesitas
```

### Cómo funciona por dentro

1. Cada pantalla (`js/views/*.js`) es una función que devuelve HTML como texto.
2. Para que un botón haga algo se usa `click(fn)` de `lib/dom.js`: `` `<button ${click(() => …)}>OK</button>` ``.
3. Para cambiar datos guardados: `commit(d => { d.xp += 10 })`. Se guarda en `localStorage` y la pantalla se vuelve a pintar sola.
4. Para cambiar el estado temporal de la pantalla: `setUI({ menuOpen: true })`.
5. Para cambiar de pantalla: `navigate('fridge')`.

### Añadir una receta

Añade un objeto a `data/recipes.json`:

```json
{
  "id": "mi-receta", "name": "My recipe", "minutes": 15, "level": 1, "tint": "#F4DFA8",
  "nutrition": { "kcal": 400, "protein": 20, "carbs": 40, "fat": 15 },
  "ingredients": [ { "name": "Eggs", "qty": 2, "unit": "pcs" }, { "name": "Salt" } ],
  "steps": [ { "text": "Do this." }, { "text": "Wait.", "timer": 300 } ]
}
```

- Los nombres de los ingredientes tienen que coincidir con los de `ingredients.json` para que funcionen la dieta y la búsqueda.
- Un ingrediente sin `qty` (sal, especias…) no se descuenta de la nevera.
- `timer` va en segundos.
- `level` puede ser 1 (Beginner), 2 (Home cook) o 3 (Chef).

## Conectar el reconocimiento de imágenes de verdad

Ahora `js/config.js` tiene `RECOGNITION_ENDPOINT = null`. Eso significa modo demo: la foto es real, pero los productos que salen son de ejemplo.

Para que reconozca de verdad necesitas un **backend pequeño**. La clave de una API de visión no debe ir nunca en el código del navegador. Ese backend:

1. Recibe `POST` con `multipart/form-data`, con los campos `image` (la foto) y `mode` (`fridge` o `receipt`).
2. Le pide a un modelo de visión que liste los alimentos de la foto o del ticket.
3. Responde con este JSON:

```json
{ "items": [ { "name": "Eggs", "qty": 6, "unit": "pcs", "expiresInDays": 14 } ] }
```

Después pon su URL en `js/config.js`:

```js
export const RECOGNITION_ENDPOINT = 'http://localhost:3000/recognize';
```

No hay que tocar nada más: `js/services/recognition.js` ya hace la llamada y la pantalla de revisión funciona igual.

## Próximos pasos posibles

- Backend de reconocimiento (Node/Express o Python/Flask) con un modelo de visión.
- Cuentas de usuario y base de datos (por ejemplo Supabase o Firebase) para sincronizar entre dispositivos.
- Más recetas, o importarlas de una API de recetas.
- Notificaciones de caducidad.
- Pasar a React o Vue si el proyecto crece mucho; la lógica de `js/domain/` se puede reutilizar tal cual.
