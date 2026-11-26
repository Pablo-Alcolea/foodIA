# FoodAI

A web app that helps you cook with what you already have in your fridge. Scan your ingredients, get recipe suggestions, follow step-by-step cooking instructions with a timer, and keep track of your streak, level, and macros.

Built with **HTML, CSS, and vanilla JavaScript** (ES modules). No installation or build step is required; run it with any local web server.

## Run the app

### Option A: from the terminal

```bash
cd ~/foodIA
python3 -m http.server 8000
```

Open **http://localhost:8000** in your browser. Press `Ctrl + C` to stop the server.

> Do not open `index.html` directly: JavaScript modules and loading the `data/*.json` files require a web server.

### Option B: from VS Code

1. Open the project folder: `code ~/foodIA` (or use **File → Open Folder**).
2. Install the **Live Server** extension; VS Code will suggest it when you open the folder.
3. Right-click `index.html` and select **Open with Live Server**. The page reloads whenever you save a file.

### On your phone

Connect your phone and Mac to the same network, for example by using your phone's hotspot:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
ipconfig getifaddr en0      # prints your IP address, e.g. 172.20.10.2
```

On your phone, open `http://YOUR-IP:8000`. In Safari, tap **Share → Add to Home Screen**.

On a phone, the camera button opens the camera. Offline mode does not work over a local IP address (`http://`); it only works on `localhost` or over `https`.

## Features

| Section | What it does |
|---|---|
| **Fridge** | Add ingredients manually (name with autocomplete, quantity, unit, expiry date, and category), adjust quantities, mark pantry staples with a star, and delete items. Get alerts for items that are expiring or running low. |
| **Scan** | Take a photo with the camera or choose one from your gallery. Review and edit the detected items before adding them to your fridge. *Recognition is in demo mode* (see below). |
| **Suggestions** | Get recipes based on your fridge, diet, and level. Recipes you can make with everything you have come first, with priority given to ingredients that are close to expiring. Recipes cooked today or yesterday are not suggested. |
| **Recipe** | See available and missing ingredients for the selected number of servings, nutrition information, and an option to add missing ingredients to your shopping list. |
| **Cooking mode** | Follow one step per screen, use timers with sound and vibration, and keep the screen awake. When you finish, ingredient quantities are deducted from your fridge (pantry staples are kept), the meal is added to your history, and you earn points. |
| **Shopping list** | Add items, mark them as purchased, and move them to your fridge with one tap. Get suggestions based on low-stock or expired items and ingredients missing from recipes you are close to making. |
| **Streak / calendar** | Browse a monthly calendar of what you cooked, your current streak, and your longest streak. |
| **Discover** | Search by dish or ingredient, and filter by protein, carbohydrates, cooking time, level, or recipes you can make with what you have. |
| **Favorites** | Save recipes with the heart button. |
| **Profile** | Set your name, diet (which filters out recipes with meat or animal products), and goal. Track your level and progress, see your daily and weekly macros, and turn macro tracking on or off. |
| **Your data** | Everything is stored in your browser (`localStorage`). You can download a backup, restore it, load demo data, or delete everything. |
| **PWA** | Install the app and use it offline when served from `localhost` or over `https`. |

## Project structure

```
foodIA/
├── index.html              ← single-page app; loads CSS and js/main.js
├── manifest.webmanifest    ← installable app metadata
├── sw.js                   ← service worker (offline support)
├── assets/                 ← icons
├── css/styles.css          ← all styles
├── data/
│   ├── recipes.json        ← add new recipes here
│   └── ingredients.json    ← ingredient catalog (category, unit, type, shelf life)
├── js/
│   ├── main.js             ← startup, events, and view selection
│   ├── config.js           ← settings (recognition URL, points, etc.)
│   ├── store.js            ← state: `data` (persistent) and `ui` (temporary)
│   ├── router.js           ← hash routes (#/fridge, #/recipe/id, etc.)
│   ├── lib/                ← utilities: dates, text, and events
│   ├── domain/             ← business logic without HTML: fridge, recipes, stats, demo
│   ├── services/recognition.js ← photo recognition
│   ├── ui/                 ← icons and reusable components (cards, header, etc.)
│   └── views/              ← one file per screen
└── prototype/index.html    ← earlier prototype
```

### How it works

1. Each screen (`js/views/*.js`) is a function that returns HTML as a string.
2. To make a button do something, use `click(fn)` from `lib/dom.js`: `` `<button ${click(() => …)}>OK</button>` ``.
3. To update persistent data, use `commit(d => { d.xp += 10 })`. The data is saved to `localStorage` and the screen is rendered again automatically.
4. To update temporary screen state, use `setUI({ menuOpen: true })`.
5. To navigate to another screen, use `navigate('fridge')`.

### Add a recipe

Add an object to `data/recipes.json`:

```json
{
  "id": "my-recipe", "name": "My recipe", "minutes": 15, "level": 1, "tint": "#F4DFA8",
  "nutrition": { "kcal": 400, "protein": 20, "carbs": 40, "fat": 15 },
  "ingredients": [ { "name": "Eggs", "qty": 2, "unit": "pcs" }, { "name": "Salt" } ],
  "steps": [ { "text": "Do this." }, { "text": "Wait.", "timer": 300 } ]
}
```

- Ingredient names must match the names in `ingredients.json` for diet filters and search to work.
- Ingredients without `qty` (such as salt and spices) are not deducted from the fridge.
- `timer` is in seconds.
- `level` can be 1 (Beginner), 2 (Home cook), or 3 (Chef).

## Connect real image recognition

`js/config.js` currently sets `RECOGNITION_ENDPOINT = null`, which enables demo mode: the photo is real, but the detected items are examples.

To enable real recognition, you need a small **backend**. Never put a vision API key in browser code. The backend should:

1. Accept a `POST` request with `multipart/form-data` fields `image` (the photo) and `mode` (`fridge` or `receipt`).
2. Ask a vision model to identify the food in the photo or receipt.
3. Return JSON in this format:

```json
{ "items": [ { "name": "Eggs", "qty": 6, "unit": "pcs", "expiresInDays": 14 } ] }
```

Then set the backend URL in `js/config.js`:

```js
export const RECOGNITION_ENDPOINT = 'http://localhost:3000/recognize';
```

Nothing else needs to change: `js/services/recognition.js` already makes the request, and the review screen works the same way.

## Possible next steps

- Add an image-recognition backend (Node/Express or Python/Flask) with a vision model.
- Add user accounts and a database (such as Supabase or Firebase) to sync data between devices.
- Add more recipes or import them from a recipe API.
- Add expiry notifications.
- Consider React or Vue if the project grows significantly; the logic in `js/domain/` can be reused as-is.

## Push changes to GitHub

From the project folder, run:

```bash
cd ~/foodIA
git add README.md
git commit -m "Translate project documentation to English"
git push origin main
```
