// Ingredient recognition from a photo of the fridge or a receipt.
//
// Without a backend (RECOGNITION_ENDPOINT = null) it runs in demo mode and returns
// sample items, so the rest of the flow (review → add to fridge) is fully usable.

import { RECOGNITION_ENDPOINT } from '../config.js';

const DEMO_RESULTS = {
  fridge: [
    { name: 'Spinach', qty: 200, unit: 'g', expiresInDays: 4 },
    { name: 'Plain yogurt', qty: 4, unit: 'pcs', expiresInDays: 10 },
    { name: 'Mushrooms', qty: 250, unit: 'g', expiresInDays: 4 },
    { name: 'Eggs', qty: 6, unit: 'pcs', expiresInDays: 14 }
  ],
  receipt: [
    { name: 'Chicken breast', qty: 300, unit: 'g', expiresInDays: 3 },
    { name: 'Chickpeas', qty: 400, unit: 'g', expiresInDays: 365 },
    { name: 'Coconut milk', qty: 400, unit: 'ml', expiresInDays: 365 },
    { name: 'Cumin', qty: 40, unit: 'g', expiresInDays: 365 },
    { name: 'Salmon', qty: 300, unit: 'g', expiresInDays: 2 }
  ]
};

export const isDemoRecognition = () => !RECOGNITION_ENDPOINT;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {File} file   photo taken with the camera or picked from the gallery
 * @param {'fridge'|'receipt'} mode
 * @returns {Promise<Array<{name:string, qty?:number, unit?:string, expiresInDays?:number}>>}
 */
export async function recognizeIngredients(file, mode) {
  if (!RECOGNITION_ENDPOINT) {
    await wait(1200);
    return DEMO_RESULTS[mode].map((item) => ({ ...item }));
  }

  const body = new FormData();
  body.append('image', file);
  body.append('mode', mode);
  const res = await fetch(RECOGNITION_ENDPOINT, { method: 'POST', body });
  if (!res.ok) throw new Error(`The recognition service answered ${res.status}.`);
  const json = await res.json();
  const items = Array.isArray(json) ? json : json.items;
  if (!Array.isArray(items)) throw new Error('The recognition service sent an unexpected answer.');
  return items
    .filter((i) => i && i.name)
    .map((i) => ({ name: String(i.name), qty: i.qty ?? null, unit: i.unit || undefined, expiresInDays: i.expiresInDays ?? undefined }));
}
