import { data, commit, toast } from '../store.js';
import { click, submit, formValues } from '../lib/dom.js';
import { esc, formatQty, lowerFirst, norm, uid, UNITS } from '../lib/utils.js';
import { icon } from '../ui/icons.js';
import { backButton, emptyState } from '../ui/components.js';
import { RECIPES, INGREDIENTS, ingredientInfo } from '../domain/catalog.js';
import { addItems, isLow, missingIngredients, expiryStatus } from '../domain/fridge.js';
import { fitsDiet } from '../domain/recipes.js';
import { levelOf } from '../domain/stats.js';

function onList(name) {
  return data.shopping.some((s) => !s.done && norm(s.name) === norm(name));
}

function addToList(name, qty = null, unit = null) {
  if (onList(name)) return;
  commit((d) => { d.shopping.push({ id: uid(), name, qty, unit: unit || ingredientInfo(name)?.unit || null, done: false }); });
}

/** Low stock, expired items and what's missing for the recipes you're closest to making. */
function suggestions() {
  const out = [];
  const seen = new Set(data.shopping.filter((s) => !s.done).map((s) => norm(s.name)));
  const push = (name, why) => { if (!seen.has(norm(name))) { seen.add(norm(name)); out.push({ name, why }); } };
  data.fridge.forEach((i) => { if (isLow(i)) push(i.name, `Only ${formatQty(i.qty, i.unit)} left`); });
  data.fridge.forEach((i) => { if (expiryStatus(i)?.level === 'expired') push(i.name, 'Yours has expired'); });
  const lvl = levelOf(data.xp);
  RECIPES
    .filter((r) => r.level <= lvl && fitsDiet(r, data.profile.diet))
    .map((r) => ({ r, missing: missingIngredients(r, data.fridge) }))
    .filter((x) => x.missing.length && x.missing.length <= 2)
    .sort((a, b) => a.missing.length - b.missing.length)
    .forEach(({ r, missing }) => missing.forEach((m) => push(m.name, `To make ${lowerFirst(r.name)}`)));
  return out.slice(0, 8);
}

function moveBoughtToFridge() {
  const bought = data.shopping.filter((s) => s.done);
  if (!bought.length) { toast('Tick what you bought first'); return; }
  commit((d) => {
    d.fridge = addItems(d.fridge, bought.map((s) => {
      const info = ingredientInfo(s.name);
      return { name: s.name, qty: s.qty, unit: s.unit, expiresInDays: info?.shelfDays };
    }));
    d.shopping = d.shopping.filter((s) => !s.done);
  });
  toast(`${bought.length} ${bought.length === 1 ? 'item' : 'items'} moved to your fridge`);
}

export function shoppingView() {
  const units = Object.entries(UNITS).map(([v, u]) => `<option value="${v}">${u.label}</option>`).join('');
  const sugg = suggestions();
  const list = data.shopping;

  return `<section aria-labelledby="h-shop">
    ${backButton()}
    <div class="headrow">
      <div><h1 id="h-shop">Shopping list</h1><p class="sub">Tick what you buy, then move it to your fridge in one tap.</p></div>
      <div class="actions"><button class="btn primary" ${click(moveBoughtToFridge)}>${icon('fridge')}Move bought items to fridge</button></div>
    </div>
    <div class="split">
      <div class="main">
        <form class="panel addform" ${submit((e, form) => {
          const v = formValues(form);
          if (!v.name.trim()) return;
          addToList(v.name.trim(), v.qty === '' ? null : Number(v.qty), v.unit);
          form.reset();
          document.getElementById('shop-name')?.focus();
        })}>
          <div class="fields">
            <label class="field grow"><span>Add to the list</span><input id="shop-name" name="name" list="ingredient-list" autocomplete="off" placeholder="E.g. Milk"></label>
            <label class="field small"><span>Qty</span><input name="qty" type="number" min="0" step="any" inputmode="decimal"></label>
            <label class="field small"><span>Unit</span><select name="unit">${units}</select></label>
          </div>
          <button type="submit" class="btn">${icon('plus')}Add</button>
          <datalist id="ingredient-list">${INGREDIENTS.map((i) => `<option value="${esc(i.name)}">`).join('')}</datalist>
        </form>
        ${list.length ? `<ul class="shop" style="margin-top:16px">${list.map((s) => `
          <li class="${s.done ? 'done' : ''}">
            <button class="box-btn" aria-pressed="${s.done}" aria-label="${s.done ? 'Not bought yet' : 'Bought'}: ${esc(s.name)}"
              ${click(() => commit((d) => { d.shopping = d.shopping.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)); }))}>
              <span class="box">${icon('check', 'i s')}</span></button>
            <span class="txt"><b>${esc(s.name)}</b><span>${formatQty(s.qty, s.unit)}</span></span>
            <button class="mini" aria-label="Remove ${esc(s.name)} from the list" ${click(() => commit((d) => { d.shopping = d.shopping.filter((x) => x.id !== s.id); }))}>${icon('trash')}</button>
          </li>`).join('')}</ul>`
        : `<div style="margin-top:16px">${emptyState('cart', 'Your shopping list is empty.')}</div>`}
      </div>
      <aside class="side"><div class="panel">
        <h2>Suggestions</h2>
        <p class="muted" style="margin:-6px 0 14px">What you're running out of and what you need for recipes you almost have.</p>
        ${sugg.length ? `<ul class="shop">${sugg.map((x) => `
          <li><span class="txt"><b>${esc(x.name)}</b><span>${esc(x.why)}</span></span>
          <button class="addb" ${click(() => { addToList(x.name); toast(`${x.name} added to your list`); })}>Add</button></li>`).join('')}</ul>`
        : '<p class="muted">No suggestions right now.</p>'}
      </div></aside>
    </div>
  </section>`;
}
