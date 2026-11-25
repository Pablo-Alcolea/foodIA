// Fridge logic: matching recipes, using up ingredients, expiry, low stock.

import { norm, round, uid } from '../lib/utils.js';
import { addDays, daysUntil, todayISO } from '../lib/dates.js';
import { ingredientInfo } from './catalog.js';

const LOW_STOCK = { pcs: 1, g: 100, ml: 200, can: 0, pack: 0 };

function index(fridge) {
  const map = new Map();
  fridge.forEach((item) => map.set(norm(item.name), item));
  return map;
}

/**
 * Recipe ingredients you don't have (or don't have enough of).
 * Ingredients without a quantity (salt, oil, spices…) are treated as pantry staples
 * and never count as missing; see staplesToCheck().
 */
export function missingIngredients(recipe, fridge, portions = 1) {
  const have = index(fridge);
  return recipe.ingredients.filter((ing) => {
    if (ing.qty == null) return false;
    const item = have.get(norm(ing.name));
    if (!item) return true;
    const enoughKnown = ing.qty != null && item.qty != null && item.unit === ing.unit;
    return enoughKnown && item.qty < ing.qty * portions;
  });
}

/** Pantry staples of the recipe that are not registered in the fridge. */
export function staplesToCheck(recipe, fridge) {
  const have = index(fridge);
  return recipe.ingredients.filter((ing) => ing.qty == null && !have.has(norm(ing.name)));
}

/** How many of the recipe's ingredients expire within 3 days. */
export function usesExpiring(recipe, fridge) {
  const have = index(fridge);
  return recipe.ingredients.filter((ing) => {
    const item = have.get(norm(ing.name));
    return item && item.expires && daysUntil(item.expires) <= 3;
  }).length;
}

/**
 * Take a recipe's quantities out of the fridge.
 * - Basics (starred) are never removed.
 * - Ingredients without a quantity in the recipe (salt, spices…) are not touched.
 * - If units match, the quantity is subtracted; otherwise the item is used up.
 */
export function consumeRecipe(fridge, recipe, portions) {
  const used = [];
  const next = [];
  fridge.forEach((item) => {
    const ing = recipe.ingredients.find((g) => norm(g.name) === norm(item.name));
    if (!ing || ing.qty == null || item.basic) { next.push(item); return; }
    if (item.qty != null && item.unit === ing.unit) {
      const left = round(item.qty - ing.qty * portions, 2);
      if (left > 0) { next.push({ ...item, qty: left }); return; }
    }
    used.push(item.name);
  });
  return { fridge: next, usedUp: used };
}

/** Add items, merging with existing ones of the same name and unit. */
export function addItems(fridge, items) {
  const next = fridge.map((i) => ({ ...i }));
  items.forEach((raw) => {
    const name = String(raw.name || '').trim();
    if (!name) return;
    const info = ingredientInfo(name);
    const unit = raw.unit || info?.unit || 'pcs';
    const qty = raw.qty === '' || raw.qty == null ? null : Number(raw.qty);
    const expires = raw.expires || (raw.expiresInDays != null ? addDays(todayISO(), Number(raw.expiresInDays)) : null);
    const existing = next.find((i) => norm(i.name) === norm(name) && i.unit === unit);
    if (existing) {
      if (existing.qty != null && qty != null) existing.qty = round(existing.qty + qty, 2);
      else if (qty != null) existing.qty = qty;
      if (expires && (!existing.expires || expires < existing.expires)) existing.expires = expires;
      return;
    }
    next.push({
      id: uid(),
      name: info?.name || name.charAt(0).toUpperCase() + name.slice(1),
      category: raw.category || info?.category || 'other',
      qty, unit, expires,
      basic: !!raw.basic,
      addedAt: todayISO()
    });
  });
  return next;
}

export function expiryStatus(item) {
  if (!item.expires) return null;
  const days = daysUntil(item.expires);
  if (days < 0) return { level: 'expired', text: days === -1 ? 'Expired yesterday' : `Expired ${-days} days ago` };
  if (days === 0) return { level: 'soon', text: 'Expires today' };
  if (days === 1) return { level: 'soon', text: 'Expires tomorrow' };
  if (days <= 3) return { level: 'soon', text: `Expires in ${days} days` };
  return { level: 'ok', text: `Expires in ${days} days` };
}

export function isLow(item) {
  if (item.basic || item.qty == null) return false;
  return item.qty <= (LOW_STOCK[item.unit] ?? 0);
}
