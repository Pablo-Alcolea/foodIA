import { data, replaceData, setUI, toast } from '../store.js';
import { click } from '../lib/dom.js';
import { esc, lowerFirst } from '../lib/utils.js';
import { longDate, todayISO } from '../lib/dates.js';
import { icon } from '../ui/icons.js';
import { recipeCard, emptyState } from '../ui/components.js';
import { navigate } from '../router.js';
import { suggestRecipes, lastCooked } from '../domain/recipes.js';
import { currentStreak } from '../domain/stats.js';
import { expiryStatus } from '../domain/fridge.js';
import { findRecipe } from '../domain/catalog.js';
import { demoData } from '../domain/demo.js';

function welcome() {
  return `<section aria-labelledby="h-home">
    <div class="hero"><div>
      <p class="eyebrow">${longDate(todayISO())}</p>
      <h1 id="h-home">Welcome to FoodAI</h1>
      <p class="sub">Tell us what's in your fridge and we'll tell you what to cook.</p>
    </div></div>
    ${emptyState('fridge', 'Your fridge is empty. Take a photo of your fridge or a receipt, or add ingredients by hand.',
      `<button class="btn primary" ${click(() => navigate('scan'))}>${icon('camera')}Scan my fridge</button>
       <button class="btn" ${click(() => { setUI({ fridgeForm: true }); navigate('fridge'); })}>${icon('plus')}Add by hand</button>
       <button class="btn ghost" ${click(() => { replaceData(demoData(data.profile.name || 'Alex')); toast('Demo data loaded'); })}>Load demo data</button>`)}
  </section>`;
}

export function homeView() {
  if (!data.fridge.length && !data.history.length) return welcome();

  const streak = currentStreak(data.history);
  const suggestions = suggestRecipes(data);
  const last = lastCooked(data.history);
  const lastRecipe = last && findRecipe(last.recipeId);
  const expiring = data.fridge.filter((i) => expiryStatus(i)?.level === 'soon' || expiryStatus(i)?.level === 'expired');
  const name = data.profile.name ? `, ${esc(data.profile.name)}` : '';

  let note = '';
  if (lastRecipe && last.date === todayISO()) {
    note = `You already made ${esc(lowerFirst(lastRecipe.name))} today. To keep things varied, we won't suggest it again for now.`;
  } else if (lastRecipe) {
    note = `Last time you made ${esc(lowerFirst(lastRecipe.name))}, so we suggest something different today.`;
  }

  return `<section aria-labelledby="h-home">
    <div class="hero">
      <div>
        <p class="eyebrow">${longDate(todayISO())}</p>
        <h1 id="h-home">What are we cooking today${name}?</h1>
        <p class="sub">Recipes you can make with the ${data.fridge.length} ingredients in your fridge.</p>
      </div>
      <button class="pill" ${click(() => navigate('calendar'))}>${icon('flame')}${streak}-day streak</button>
    </div>
    ${note ? `<div class="note">${icon('rotate', 'i s')}<span>${note}</span></div>` : ''}
    ${expiring.length ? `<div class="note warn">${icon('alert', 'i s')}<span>Use soon: <b>${esc(expiring.map((i) => i.name).join(', '))}</b>. Recipes that use them come first.</span></div>` : ''}
    ${suggestions.length
      ? `<div class="grid">${suggestions.map((r) => recipeCard(r)).join('')}</div>`
      : emptyState('pot', 'No suggestions right now. Try Discover to see every recipe.', `<button class="btn" ${click(() => navigate('discover'))}>Discover recipes</button>`)}
    <div class="legend">
      <span>${icon('star', 'i s', 'fill:#B07800;color:#B07800')}You have every ingredient</span>
      <span>${icon('star', 'i s', 'color:#B07800')}Something is missing</span>
      <span>${icon('egg', 'i s')}Protein</span><span>${icon('cube', 'i s')}Carbs</span><span>${icon('drop', 'i s')}Fat</span>
    </div>
    <div style="margin-top:24px"><button class="btn" ${click(() => navigate('discover'))}>${icon('search')}See all recipes</button></div>
  </section>`;
}
