import { data, ui, setUI } from '../store.js';
import { click, input } from '../lib/dom.js';
import { esc } from '../lib/utils.js';
import { icon } from '../ui/icons.js';
import { recipeCard, chip, emptyState } from '../ui/components.js';
import { searchRecipes } from '../domain/recipes.js';
import { LEVELS } from '../domain/stats.js';

function setFilter(patch) {
  setUI({ discover: { ...ui.discover, ...patch } });
}

export function discoverView() {
  const f = ui.discover;
  const results = searchRecipes(data, f);
  const toggle = (key) => () => setFilter({ [key]: !f[key] });

  return `<section aria-labelledby="h-disc">
    <div class="headrow"><div><h1 id="h-disc">Discover new recipes</h1><p class="sub">Search by dish or ingredient and filter by macros, time or level.</p></div></div>
    <label class="search">${icon('search')}<span class="sr">Search recipes</span>
      <input id="search" type="search" placeholder="E.g. eggs, chickpeas, chicken…" value="${esc(f.q)}" ${input((e) => setFilter({ q: e.target.value }))}></label>
    <div class="chips" aria-label="Quick searches">
      ${['Eggs', 'Chicken', 'Rice', 'Chickpeas', 'Zucchini'].map((w) => `<button class="chip" ${click(() => setFilter({ q: w }))}>${w}</button>`).join('')}
    </div>
    <p class="flabel">Macros and time</p>
    <div class="chips">
      ${chip('High protein', f.protein, toggle('protein'))}
      ${chip('Low carb', f.lowCarb, toggle('lowCarb'))}
      ${chip('20 min or less', f.quick, toggle('quick'))}
      ${chip('Only what I have', f.have, toggle('have'))}
    </div>
    <p class="flabel">Level</p>
    <div class="chips">${[0, 1, 2, 3].map((n) => chip(n ? LEVELS[n].name : 'All', f.level === n, () => setFilter({ level: n }))).join('')}</div>
    <p style="margin:22px 0 14px;font-weight:600" aria-live="polite">${results.length} ${results.length === 1 ? 'recipe' : 'recipes'}</p>
    ${results.length
      ? `<div class="grid">${results.map((r) => recipeCard(r)).join('')}</div>`
      : emptyState('search', 'No recipes match those filters. Try removing one.',
          `<button class="btn" ${click(() => setUI({ discover: { q: '', protein: false, lowCarb: false, quick: false, have: false, level: 0 } }))}>Clear filters</button>`)}
  </section>`;
}
