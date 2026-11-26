import { data, ui, commit, setUI, toast } from '../store.js';
import { click } from '../lib/dom.js';
import { esc, formatQty, uid } from '../lib/utils.js';
import { icon, DISH } from '../ui/icons.js';
import { backButton, heartButton, starBadge, emptyState, recipePhoto, photoCredit } from '../ui/components.js';
import { navigate } from '../router.js';
import { findRecipe } from '../domain/catalog.js';
import { missingIngredients, staplesToCheck } from '../domain/fridge.js';
import { LEVELS, levelOf } from '../domain/stats.js';
import { norm } from '../lib/utils.js';

export function portionsFor(id) {
  return ui.portions[id] || 1;
}

function setPortions(id, n) {
  setUI({ portions: { ...ui.portions, [id]: Math.min(8, Math.max(1, n)) } });
}

function addMissingToShopping(recipe, missing, portions) {
  commit((d) => {
    missing.forEach((ing) => {
      if (d.shopping.some((s) => !s.done && norm(s.name) === norm(ing.name))) return;
      d.shopping.push({ id: uid(), name: ing.name, qty: ing.qty != null ? ing.qty * portions : null, unit: ing.unit || null, done: false });
    });
  });
  toast('Missing items added to your shopping list');
}

export function recipeView(id) {
  const recipe = findRecipe(id);
  if (!recipe) return emptyState('search', 'This recipe does not exist.', `<button class="btn" ${click(() => navigate('discover'))}>See all recipes</button>`);

  const portions = portionsFor(id);
  const missing = missingIngredients(recipe, data.fridge, portions);
  const missingNames = new Set(missing.map((m) => norm(m.name)));
  const checkNames = new Set(staplesToCheck(recipe, data.fridge).map((m) => norm(m.name)));
  const locked = recipe.level > levelOf(data.xp);
  const n = recipe.nutrition;

  const ingredients = recipe.ingredients.map((ing) => {
    const miss = missingNames.has(norm(ing.name));
    const check = checkNames.has(norm(ing.name));
    const qty = ing.qty != null ? formatQty(ing.qty * portions, ing.unit) : 'to taste';
    const tag = miss ? 'Missing' : check ? 'Check you have it' : 'In your fridge';
    return `<li class="${miss ? 'miss' : check ? 'check' : 'have'}"><span>${esc(ing.name)}</span><span class="q">${qty}</span><span class="tag">${tag}</span></li>`;
  }).join('');

  return `<section aria-labelledby="h-recipe">
    ${backButton()}
    <div class="detail">
      <div class="dcol">
        <figure class="bigfig">
          <div class="bigph" style="background:${recipe.tint}">${DISH}${recipePhoto(recipe, 'eager')}${starBadge(!missing.length)}</div>
          ${photoCredit(recipe)}
        </figure>
        <div class="panel">
          <h2>Ingredients</h2>
          <ul class="ing">${ingredients}</ul>
          ${missing.length ? `<div style="margin-top:14px"><button class="btn" ${click(() => addMissingToShopping(recipe, missing, portions))}>${icon('cart')}Add what's missing to the shopping list</button></div>` : ''}
        </div>
      </div>
      <div class="dcol">
        <div class="dhead">
          <div>
            <p class="eyebrow">Recipe · ${recipe.steps.length} steps</p>
            <h1 id="h-recipe">${esc(recipe.name)}</h1>
            <div class="meta" style="margin-top:10px;font-size:15px">
              <span>${icon('clock', 'i s')}${recipe.minutes} min</span>
              <span>${icon('hat', 'i s')}${LEVELS[recipe.level].name} level</span>
            </div>
          </div>
          ${heartButton(recipe, 'position:static;flex:none;width:52px;height:52px')}
        </div>
        ${missing.length
          ? `<p class="match warn" style="font-size:15px">Missing: ${esc(missing.map((m) => m.name.toLowerCase()).join(', '))}</p>`
          : '<p class="match ok" style="font-size:15px">You have everything in your fridge</p>'}
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <span style="font-weight:600">Servings</span>
          <div class="stepper">
            <button aria-label="One serving less" ${click(() => setPortions(id, portions - 1))}>${icon('minus')}</button>
            <output aria-live="polite">${portions} ${portions === 1 ? 'serving' : 'servings'}</output>
            <button aria-label="One serving more" ${click(() => setPortions(id, portions + 1))}>${icon('plus')}</button>
          </div>
        </div>
        ${data.profile.tracker ? `<div class="mbox">
          <div class="m"><span>Energy</span><b>${n.kcal * portions}</b><span>kcal</span></div>
          <div class="m"><span>${icon('egg', 'i s')}Protein</span><b>${n.protein * portions} g</b></div>
          <div class="m"><span>${icon('cube', 'i s')}Carbs</span><b>${n.carbs * portions} g</b></div>
          <div class="m"><span>${icon('drop', 'i s')}Fat</span><b>${n.fat * portions} g</b></div>
        </div>` : ''}
        <div class="panel">
          <h2>How to make it</h2>
          <ol class="steps">${recipe.steps.map((s) => `<li>${esc(s.text)}</li>`).join('')}</ol>
        </div>
        ${locked
          ? `<div class="lockmsg">${icon('lock')}<span>This recipe unlocks at the <b>${LEVELS[recipe.level].name}</b> level. Keep cooking to level up.</span></div>`
          : `<button class="btn primary big" ${click(() => { ui.cook = null; navigate(`cook/${recipe.id}`); })}>${icon('pot')}Start cooking</button>`}
      </div>
    </div>
  </section>`;
}
