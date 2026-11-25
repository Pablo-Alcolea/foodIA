// Which recipes to suggest, filtering and diet rules.

import { RECIPES, ingredientInfo } from './catalog.js';
import { missingIngredients, usesExpiring } from './fridge.js';
import { levelOf } from './stats.js';
import { addDays, todayISO } from '../lib/dates.js';
import { norm } from '../lib/utils.js';

export function fitsDiet(recipe, diet) {
  if (diet === 'omni') return true;
  return recipe.ingredients.every((ing) => {
    const kind = ingredientInfo(ing.name)?.kind || 'plant';
    if (diet === 'vegetarian') return kind !== 'meat' && kind !== 'fish';
    if (diet === 'vegan') return kind === 'plant';
    return true;
  });
}

/** Recipe ids cooked today or yesterday (used to vary suggestions). */
export function recentlyCooked(history) {
  const since = addDays(todayISO(), -1);
  return new Set(history.filter((h) => h.date >= since).map((h) => h.recipeId));
}

export function lastCooked(history) {
  return [...history].sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null;
}

/**
 * Suggestions for the home screen:
 * fits your diet and level, not cooked in the last 2 days,
 * fewest missing ingredients first, then the ones that use food about to expire.
 */
export function suggestRecipes(data, limit = 6) {
  const lvl = levelOf(data.xp);
  const recent = recentlyCooked(data.history);
  return RECIPES
    .filter((r) => r.level <= lvl && fitsDiet(r, data.profile.diet) && !recent.has(r.id))
    .map((r) => ({ r, missing: missingIngredients(r, data.fridge).length, expiring: usesExpiring(r, data.fridge) }))
    .sort((a, b) => a.missing - b.missing || b.expiring - a.expiring)
    .slice(0, limit)
    .map((x) => x.r);
}

export function searchRecipes(data, filters) {
  const q = norm(filters.q);
  return RECIPES.filter((r) => {
    if (!fitsDiet(r, data.profile.diet)) return false;
    if (q && !norm(r.name).includes(q) && !r.ingredients.some((i) => norm(i.name).includes(q))) return false;
    if (filters.protein && r.nutrition.protein < 25) return false;
    if (filters.lowCarb && r.nutrition.carbs > 35) return false;
    if (filters.quick && r.minutes > 20) return false;
    if (filters.level && r.level !== filters.level) return false;
    if (filters.have && missingIngredients(r, data.fridge).length) return false;
    return true;
  });
}
