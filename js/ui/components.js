// Reusable pieces of UI shared by several screens.

import { data, ui, commit, setUI, toast } from '../store.js';
import { click } from '../lib/dom.js';
import { esc } from '../lib/utils.js';
import { icon, toggleIcon, DISH } from './icons.js';
import { navigate, goBack } from '../router.js';
import { missingIngredients } from '../domain/fridge.js';
import { LEVELS, currentStreak, levelOf } from '../domain/stats.js';

export function toggleFavorite(recipe) {
  const isFav = data.favorites.includes(recipe.id);
  commit((d) => {
    d.favorites = isFav ? d.favorites.filter((id) => id !== recipe.id) : [...d.favorites, recipe.id];
  });
  toast(isFav ? 'Removed from your favourites' : 'Saved to your favourites');
}

export function heartButton(recipe, style = '') {
  const fav = data.favorites.includes(recipe.id);
  return `<button class="heartbtn${fav ? ' on' : ''}"${style ? ` style="${style}"` : ''}
    aria-label="${fav ? 'Remove from' : 'Save to'} favourites: ${esc(recipe.name)}" aria-pressed="${fav}"
    ${click(() => toggleFavorite(recipe))}>${toggleIcon('heart', fav)}</button>`;
}

export function starBadge(hasAll) {
  return `<span class="star"><svg class="i" viewBox="0 0 24 24" role="img"
    aria-label="${hasAll ? 'You have every ingredient' : 'Some ingredients are missing'}"
    style="fill:${hasAll ? 'currentColor' : 'none'}"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg></span>`;
}

export function macrosRow(n) {
  return `<div class="macros">
    <span title="Protein">${icon('egg', 'i s')}<span class="sr">Protein</span>${n.protein} g</span>
    <span title="Carbs">${icon('cube', 'i s')}<span class="sr">Carbs</span>${n.carbs} g</span>
    <span title="Fat">${icon('drop', 'i s')}<span class="sr">Fat</span>${n.fat} g</span>
  </div>`;
}

export function matchText(missing) {
  if (!missing.length) return '<p class="match ok">You have everything in your fridge</p>';
  return `<p class="match warn">Missing: ${esc(missing.map((m) => m.name.toLowerCase()).join(', '))}</p>`;
}

export function recipeCard(recipe, { macros = true } = {}) {
  const missing = missingIngredients(recipe, data.fridge);
  const locked = recipe.level > levelOf(data.xp);
  return `<article class="card">
    <button class="cardmain" ${click(() => navigate(`recipe/${recipe.id}`))}>
      <div class="ph" style="background:${recipe.tint}">
        ${DISH}
        ${starBadge(!missing.length)}
        ${locked ? `<span class="lock">${icon('lock', 'i s')}${LEVELS[recipe.level].name} level</span>` : ''}
      </div>
      <div class="cbody">
        <h3>${esc(recipe.name)}</h3>
        <div class="meta">
          <span>${icon('clock', 'i s')}${recipe.minutes} min</span>
          <span>${icon('hat', 'i s')}${LEVELS[recipe.level].name}</span>
          <span>${recipe.nutrition.kcal} kcal</span>
        </div>
        ${macros && data.profile.tracker ? macrosRow(recipe.nutrition) : ''}
        ${matchText(missing)}
      </div>
    </button>
    ${heartButton(recipe)}
  </article>`;
}

export function backButton(label = 'Back') {
  return `<div class="backrow"><button class="btn ghost" ${click(() => goBack())}>${icon('back')}${label}</button></div>`;
}

export function chip(label, active, onClick) {
  return `<button class="chip${active ? ' on' : ''}" aria-pressed="${!!active}" ${click(onClick)}>${esc(label)}</button>`;
}

export function emptyState(iconName, text, actions = '') {
  return `<div class="empty">${icon(iconName, 'i', 'width:34px;height:34px')}<p>${text}</p>${actions ? `<div class="actions" style="justify-content:center">${actions}</div>` : ''}</div>`;
}

export function header(route) {
  const streak = currentStreak(data.history);
  const toBuy = data.shopping.filter((s) => !s.done).length;
  const item = (name, iconName, title, sub, badge, color, badgeStyle) => `
    <button class="mitem${route === name ? ' on' : ''}" ${click(() => navigate(name))}>
      <span class="micon"${color ? ` style="color:${color}"` : ''}>${icon(iconName)}</span>
      <span>${title}<small>${sub}</small></span>
      ${badge != null ? `<span class="badge"${badgeStyle ? ` style="${badgeStyle}"` : ''}>${badge}</span>` : ''}
    </button>`;
  return `<header class="top"><div class="topin">
    <div style="justify-self:start">
      <button class="iconbtn${route === 'profile' ? ' on' : ''}" aria-label="Your profile" ${click(() => navigate('profile'))}>${icon('user')}</button>
    </div>
    <button class="logo" aria-label="FoodAI, go to home" ${click(() => navigate('home'))}>FOOD<span>AI</span></button>
    <div class="menuwrap">
      <button class="iconbtn${ui.menuOpen ? ' on' : ''}" aria-label="Open menu" aria-expanded="${ui.menuOpen}" ${click(() => setUI({ menuOpen: !ui.menuOpen }))}>${icon('menu')}</button>
      ${ui.menuOpen ? `<nav class="dropdown" aria-label="Main menu">
        ${item('fridge', 'fridge', 'Fridge', 'Your ingredients', data.fridge.length, '', 'background:#E3F0E6;color:#1F5C39')}
        ${item('shopping', 'cart', 'Shopping list', 'What to buy next', toBuy || null, '', 'background:#E3F0E6;color:#1F5C39')}
        ${item('calendar', 'flame', 'Streak', 'Calendar of what you cook', streak, '#B5520B', '')}
        ${item('discover', 'hat', 'Discover', 'Search by ingredient or macros', null, '', '')}
        ${item('favorites', 'heart', 'Favourites', 'Your saved recipes', data.favorites.length, '#B42E44', 'background:#FDF1F3;color:#9E2639')}
      </nav>` : ''}
    </div>
  </div></header>`;
}

export function cameraButton() {
  return `<button class="fab" aria-label="Scan ingredients with the camera" ${click(() => navigate('scan'))}>${icon('camera')}</button>`;
}

export function toastView() {
  return ui.toast ? `<div class="toast" role="status">${icon('check', 'i s')}${esc(ui.toast)}</div>` : '';
}
