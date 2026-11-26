// Recipe and ingredient catalogue, loaded from /data/*.json.

import { norm } from '../lib/utils.js';

export let RECIPES = [];
export let INGREDIENTS = [];
const byName = new Map();

export async function loadCatalog() {
  const [recipes, ingredients] = await Promise.all([
    fetch('data/recipes.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('recipes.json'); return r.json(); }),
    fetch('data/ingredients.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('ingredients.json'); return r.json(); })
  ]);
  RECIPES = recipes;
  INGREDIENTS = ingredients;
  byName.clear();
  ingredients.forEach((i) => byName.set(norm(i.name), i));
}

export function findRecipe(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

export function ingredientInfo(name) {
  return byName.get(norm(name)) || null;
}

export const CATEGORIES = [
  { id: 'veg', label: 'Fruit and veg' },
  { id: 'protein', label: 'Protein' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'other', label: 'Other' }
];
