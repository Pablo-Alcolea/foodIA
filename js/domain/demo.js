// Sample data so the app can be shown without typing everything in.

import { addDays, todayISO } from '../lib/dates.js';
import { emptyData } from '../store.js';
import { addItems } from './fridge.js';
import { findRecipe } from './catalog.js';

export function demoData(name = 'Alex') {
  const d = emptyData();
  d.profile.name = name;
  d.fridge = addItems([], [
    { name: 'Rice', qty: 1000, unit: 'g', basic: true },
    { name: 'Pasta', qty: 500, unit: 'g', basic: true },
    { name: 'Olive oil', qty: 750, unit: 'ml', basic: true },
    { name: 'Salt', basic: true },
    { name: 'Garlic', qty: 6, unit: 'pcs', basic: true },
    { name: 'Potatoes', qty: 4, unit: 'pcs', expiresInDays: 20 },
    { name: 'Onion', qty: 2, unit: 'pcs', expiresInDays: 25 },
    { name: 'Red pepper', qty: 2, unit: 'pcs', expiresInDays: 5 },
    { name: 'Carrot', qty: 3, unit: 'pcs', expiresInDays: 12 },
    { name: 'Zucchini', qty: 1, unit: 'pcs', expiresInDays: 2 },
    { name: 'Lemon', qty: 2, unit: 'pcs', expiresInDays: 14 },
    { name: 'Eggs', qty: 6, unit: 'pcs', expiresInDays: 12 },
    { name: 'Chicken breast', qty: 300, unit: 'g', expiresInDays: 1 },
    { name: 'Canned tuna', qty: 2, unit: 'can' },
    { name: 'Grated cheese', qty: 150, unit: 'g', expiresInDays: 15 },
    { name: 'Milk', qty: 1000, unit: 'ml', expiresInDays: 2 },
    { name: 'Crushed tomatoes', qty: 400, unit: 'g' },
    { name: 'Wheat tortillas', qty: 8, unit: 'pcs', expiresInDays: 20 },
    { name: 'Soy sauce', qty: 150, unit: 'ml' }
  ]);
  const today = todayISO();
  const past = [[-1, 'tuna-pasta'], [-2, 'quesadillas'], [-3, 'fried-rice'], [-5, 'lemon-chicken'], [-7, 'fried-rice'], [-8, 'zucchini-soup'], [-10, 'quesadillas'], [-11, 'spanish-omelette']];
  d.history = past
    .map(([offset, id]) => {
      const r = findRecipe(id);
      if (!r) return null;
      return { id: `demo${offset}`, date: addDays(today, offset), recipeId: id, portions: 1, kcal: r.nutrition.kcal, protein: r.nutrition.protein, carbs: r.nutrition.carbs, fat: r.nutrition.fat };
    })
    .filter(Boolean);
  d.favorites = ['spanish-omelette', 'tuna-pasta', 'quesadillas'];
  d.xp = 340;
  return d;
}
