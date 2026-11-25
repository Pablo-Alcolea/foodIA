// Entry point: loads the catalogue, wires events, renders the current screen.

import { ui, subscribe, setUI } from './store.js';
import { EVENT_TYPES, dispatch, resetHandlers, captureFocus, restoreFocus } from './lib/dom.js';
import { currentRoute } from './router.js';
import { loadCatalog } from './domain/catalog.js';
import { header, cameraButton, toastView } from './ui/components.js';
import { homeView } from './views/home.js';
import { scanView, resetScan } from './views/scan.js';
import { recipeView } from './views/recipe.js';
import { cookView, stopCooking } from './views/cook.js';
import { fridgeView } from './views/fridge.js';
import { shoppingView } from './views/shopping.js';
import { calendarView } from './views/calendar.js';
import { discoverView } from './views/discover.js';
import { favoritesView } from './views/favorites.js';
import { profileView } from './views/profile.js';

const VIEWS = {
  home: () => homeView(),
  scan: () => scanView(),
  recipe: ([id]) => recipeView(id),
  cook: ([id]) => cookView(id),
  fridge: () => fridgeView(),
  shopping: () => shoppingView(),
  calendar: () => calendarView(),
  discover: () => discoverView(),
  favorites: () => favoritesView(),
  profile: () => profileView()
};

const app = document.getElementById('app');
let ready = false;

function render() {
  if (!ready) return;
  const route = currentRoute();
  const view = VIEWS[route.name] || VIEWS.home;
  const focus = captureFocus();
  resetHandlers();
  const showCamera = route.name !== 'scan' && route.name !== 'cook';
  app.innerHTML = `
    <div class="shell">
      ${header(route.name)}
      <main class="wrap" id="main">${view(route.params)}</main>
      ${showCamera ? cameraButton() : ''}
      ${toastView()}
    </div>`;
  restoreFocus(focus);
}

function onRouteChange() {
  const route = currentRoute();
  if (route.name !== 'cook') stopCooking();
  if (route.name !== 'scan' && ui.scan.status !== 'idle') resetScan();
  ui.menuOpen = false;
  render();
  window.scrollTo(0, 0);
}

async function start() {
  EVENT_TYPES.forEach((type) => document.addEventListener(type, (e) => dispatch(type, e)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.menuOpen) setUI({ menuOpen: false }); });
  window.addEventListener('hashchange', onRouteChange);
  subscribe(render);

  try {
    await loadCatalog();
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="wrap"><div class="empty"><p><b>Could not load the recipe data.</b></p>
      <p>Open the app through a local server (see README), not by double-clicking index.html.</p></div></div>`;
    return;
  }
  ready = true;
  render();
}

start();

// Offline support + "Add to Home Screen". Only works on https or localhost.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('[FoodAI] Service worker not registered', err));
  });
}
