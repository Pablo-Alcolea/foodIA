// Application state.
//
// `data` is saved in localStorage (fridge, history, favourites…).
// `ui` is temporary screen state (open menu, filters, timer…) and is not saved.
// Change `data` only through commit() so it is saved and the screen re-renders.

import { STORAGE_KEY } from './config.js';
import { currentMonth } from './lib/dates.js';

export function emptyData() {
  return {
    version: 1,
    profile: { name: '', diet: 'omni', goal: 'maintain', tracker: true },
    fridge: [],      // { id, name, category, qty, unit, expires, basic, addedAt }
    shopping: [],    // { id, name, qty, unit, done }
    favorites: [],   // recipe ids
    history: [],     // { id, date, recipeId, portions, kcal, protein, carbs, fat }
    xp: 0
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const saved = JSON.parse(raw);
    const base = emptyData();
    return { ...base, ...saved, profile: { ...base.profile, ...saved.profile } };
  } catch (err) {
    console.warn('[FoodAI] Could not read saved data, starting fresh.', err);
    return emptyData();
  }
}

export const data = load();

export const ui = {
  menuOpen: false,
  toast: null,
  portions: {},                 // recipeId -> servings
  cook: null,                   // { recipeId, step, timeLeft, running }
  scan: { mode: 'fridge', status: 'idle', items: [], preview: null, error: null },
  fridgeForm: false,
  confirmReset: false,
  discover: { q: '', protein: false, lowCarb: false, quick: false, have: false, level: 0 },
  calMonth: currentMonth(),
  calDay: null
};

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); }
function emit() { listeners.forEach((fn) => fn()); }

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[FoodAI] Could not save data.', err);
  }
}

/** Change saved data: commit(d => { d.xp += 10 }) */
export function commit(mutator) {
  mutator(data);
  save();
  emit();
}

/** Replace all saved data (reset, import, demo). */
export function replaceData(next) {
  Object.keys(data).forEach((k) => delete data[k]);
  Object.assign(data, next);
  save();
  emit();
}

/** Change temporary screen state. */
export function setUI(patch) {
  Object.assign(ui, typeof patch === 'function' ? patch(ui) : patch);
  emit();
}

/** Re-render without changing anything (e.g. after a silent ui mutation). */
export function refresh() { emit(); }

let toastTimer = null;
export function toast(message) {
  clearTimeout(toastTimer);
  setUI({ toast: message });
  toastTimer = setTimeout(() => setUI({ toast: null }), 3500);
}
