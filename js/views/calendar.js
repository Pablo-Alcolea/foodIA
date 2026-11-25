import { data, ui, setUI } from '../store.js';
import { click } from '../lib/dom.js';
import { esc } from '../lib/utils.js';
import { longDate, monthGrid, monthLabel, shiftMonth, todayISO, currentMonth } from '../lib/dates.js';
import { icon } from '../ui/icons.js';
import { navigate } from '../router.js';
import { findRecipe } from '../domain/catalog.js';
import { currentStreak, bestStreak, cookedToday, entriesOn } from '../domain/stats.js';

export function calendarView() {
  const today = todayISO();
  const streak = currentStreak(data.history);
  const doneToday = cookedToday(data.history);
  const month = ui.calMonth;
  const sel = ui.calDay || today;
  const inMonth = data.history.filter((h) => h.date.startsWith(month));
  const daysInMonth = new Set(inMonth.map((h) => h.date)).size;
  const distinct = new Set(data.history.map((h) => h.recipeId)).size;

  const cells = monthGrid(month).map((iso) => {
    if (!iso) return '<span></span>';
    const entries = entriesOn(data.history, iso);
    const cls = ['day', entries.length && 'cooked', iso > today && 'future', iso === today && 'today', iso === sel && 'sel'].filter(Boolean).join(' ');
    const names = entries.map((e) => findRecipe(e.recipeId)?.name).filter(Boolean).join(', ');
    return `<button class="${cls}" aria-pressed="${iso === sel}" aria-label="${longDate(iso)}${iso === today ? ', today' : ''}${names ? `, you cooked ${esc(names)}` : ''}"
      ${click(() => setUI({ calDay: iso }))}><span>${Number(iso.slice(8))}</span>${entries.length ? icon('flame') : ''}</button>`;
  }).join('');

  const selEntries = entriesOn(data.history, sel);
  let info;
  if (selEntries.length) {
    info = selEntries.map((e) => {
      const r = findRecipe(e.recipeId);
      return `<div class="dayentry"><h2>${esc(r?.name || 'Recipe')}</h2>
        <p class="muted">${e.portions} ${e.portions === 1 ? 'serving' : 'servings'} · ${e.kcal} kcal</p>
        ${r ? `<button class="btn" ${click(() => navigate(`recipe/${r.id}`))}>Make it again</button>` : ''}</div>`;
    }).join('');
  } else if (sel === today) {
    info = `<h2>You haven't cooked yet today</h2><p class="muted" style="margin-bottom:14px">Cook something today to keep your streak growing.</p>
      <button class="btn primary" ${click(() => navigate('home'))}>See possible recipes</button>`;
  } else if (sel < today) {
    info = '<h2>No cooking this day</h2><p class="muted">No problem: what matters is getting back in the kitchen.</p>';
  } else {
    info = "<h2>This day hasn't come yet</h2><p class=\"muted\">What you cook will show up here.</p>";
  }

  return `<section aria-labelledby="h-cal">
    <div class="headrow"><div><h1 id="h-cal">Your streak</h1><p class="sub">The days you cooked and what you made.</p></div></div>
    <div class="split">
      <div class="main">
        <div class="streakcard">
          <span class="flamebig">${icon('flame')}</span>
          <div style="flex:1 1 200px"><p class="streaknum">${streak} ${streak === 1 ? 'day' : 'days'}</p>
            <p style="font-weight:600;color:#7A3A06;margin-top:4px">${doneToday ? 'You already cooked today! Come back tomorrow to keep it going.' : `Cook today to reach ${streak + 1} ${streak + 1 === 1 ? 'day' : 'days'}.`}</p></div>
          ${doneToday ? '' : `<button class="btn dark" ${click(() => navigate('home'))}>Cook today</button>`}
        </div>
        <div class="panel" style="margin-top:20px">
          <div class="monthnav">
            <button class="mini" aria-label="Previous month" ${click(() => setUI({ calMonth: shiftMonth(month, -1) }))}>${icon('back')}</button>
            <h2 style="margin:0">${monthLabel(month)}</h2>
            <button class="mini" aria-label="Next month" ${month >= currentMonth() ? 'disabled' : ''} ${click(() => setUI({ calMonth: shiftMonth(month, 1) }))}>${icon('next')}</button>
            <span class="count" style="margin-left:auto">${daysInMonth} ${daysInMonth === 1 ? 'day' : 'days'} cooking</span>
          </div>
          <div class="cal">
            <span class="dow">M</span><span class="dow">T</span><span class="dow">W</span><span class="dow">T</span><span class="dow">F</span><span class="dow">S</span><span class="dow">S</span>
            ${cells}
          </div>
        </div>
      </div>
      <aside class="side"><div class="panel">
        <p class="eyebrow">${longDate(sel)}</p>
        ${info}
        <div style="margin-top:18px">
          <div class="stat"><span>Current streak</span><b>${streak} ${streak === 1 ? 'day' : 'days'}</b></div>
          <div class="stat"><span>Best streak</span><b>${bestStreak(data.history)} days</b></div>
          <div class="stat"><span>Different recipes</span><b>${distinct}</b></div>
          <div class="stat"><span>Meals cooked</span><b>${data.history.length}</b></div>
        </div>
      </div></aside>
    </div>
  </section>`;
}
