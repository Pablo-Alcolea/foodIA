import { data } from '../store.js';
import { click } from '../lib/dom.js';
import { esc } from '../lib/utils.js';
import { icon } from '../ui/icons.js';
import { recipeCard, emptyState } from '../ui/components.js';
import { navigate } from '../router.js';
import { findRecipe } from '../domain/catalog.js';

export function favoritesView() {
  const list = data.favorites.map(findRecipe).filter(Boolean);
  const basics = data.fridge.filter((i) => i.basic);

  return `<section aria-labelledby="h-favs">
    <div class="headrow"><div><h1 id="h-favs">Your favourites</h1><p class="sub">Your cookbook: the dishes that turned out well and you want to make again.</p></div></div>
    ${list.length
      ? `<div class="grid">${list.map((r) => recipeCard(r, { macros: false })).join('')}</div>`
      : emptyState('heart', "You don't have any favourites yet. Tap the heart on a recipe to save it here.", `<button class="btn" ${click(() => navigate('discover'))}>Discover recipes</button>`)}
    <div class="panel" style="margin-top:26px">
      <h2 style="display:flex;align-items:center;gap:10px">${icon('star', 'i', 'fill:#B07800;color:#B07800')}Your everyday basics</h2>
      <p class="muted" style="margin:-6px 0 12px">What you always have at home. Change them from the fridge with the star.</p>
      ${basics.length ? `<div class="chips">${basics.map((i) => `<span class="chip" style="cursor:default">${esc(i.name)}</span>`).join('')}</div>` : '<p class="muted">No basics yet.</p>'}
    </div>
  </section>`;
}
