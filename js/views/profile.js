import { data, ui, commit, setUI, replaceData, toast } from '../store.js';
import { click, submit, change, formValues } from '../lib/dom.js';
import { esc } from '../lib/utils.js';
import { todayISO } from '../lib/dates.js';
import { icon } from '../ui/icons.js';
import { chip } from '../ui/components.js';
import { navigate } from '../router.js';
import { LEVELS, GOALS, levelProgress, currentStreak, totalsOn, weekKcal } from '../domain/stats.js';
import { demoData } from '../domain/demo.js';
import { emptyData } from '../store.js';

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `foodai-backup-${todayISO()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !Array.isArray(parsed.fridge) || !Array.isArray(parsed.history)) throw new Error('bad file');
    replaceData({ ...emptyData(), ...parsed });
    toast('Backup restored');
  } catch {
    toast('That file is not a FoodAI backup');
  }
}

function macroRow(iconName, label, value, goal, color) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return `<div class="mrow"><div class="lab"><span>${icon(iconName, 'i s')}${label}</span><b>${value} / ${goal} g</b></div>
    <div class="bar"><div style="width:${pct}%;background:${color}"></div></div></div>`;
}

export function profileView() {
  const p = data.profile;
  const { lvl, pct, toNext } = levelProgress(data.xp);
  const goal = GOALS[p.goal];
  const today = totalsOn(data.history, todayISO());
  const week = weekKcal(data.history);
  const streak = currentStreak(data.history);
  const initial = (p.name || 'You').charAt(0).toUpperCase();
  const max = Math.max(goal.kcal, ...week.map((w) => w.kcal));

  return `<section aria-labelledby="h-prof">
    <h1 id="h-prof" class="sr">Your profile</h1>
    <div class="headrow" style="align-items:center">
      <div style="display:flex;align-items:center;gap:16px">
        <span class="avatar" aria-hidden="true">${esc(initial)}</span>
        <form class="namefield" ${submit((e, form) => { const v = formValues(form); commit((d) => { d.profile.name = v.name.trim(); }); toast('Name saved'); })}>
          <label class="sr" for="profile-name">Your name</label>
          <input id="profile-name" name="name" value="${esc(p.name)}" placeholder="Your name" autocomplete="given-name">
          <button class="btn ghost" type="submit">Save</button>
        </form>
      </div>
      <button class="pill" ${click(() => navigate('calendar'))}>${icon('flame')}${streak}-day streak</button>
    </div>

    <div class="pgrid">
      <div class="panel">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
          ${icon('hat', 'i', 'width:34px;height:34px')}
          <div><p class="eyebrow" style="margin:0">Your cooking level</p><h2 style="margin:0">${LEVELS[lvl].name}</h2></div>
          <span class="count" style="margin-left:auto">${data.xp} points</span>
        </div>
        <div class="bar" style="margin-top:14px" role="progressbar" aria-label="Progress to the next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div style="width:${pct}%;background:#2E7D4F"></div></div>
        <p class="muted" style="margin-top:8px">${lvl < 3 ? `${toNext} more points to reach ${LEVELS[lvl + 1].name}.` : 'You reached the top level. You are a chef!'}</p>
        <div class="lvls">${[1, 2, 3].map((n) => `<div class="lv${n < lvl ? ' done' : n === lvl ? ' cur' : ''}"><span>${LEVELS[n].name}</span>
          <small>${n < lvl ? 'Completed' : `${n === lvl ? 'Your level' : 'Locked'} · ${LEVELS[n].desc}`}</small></div>`).join('')}</div>
        <p class="muted" style="margin-top:14px">Every recipe you finish earns points. When you level up, harder recipes unlock.</p>
      </div>

      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="margin:0">Today's macros</h2><span class="count">${today.kcal} / ${goal.kcal} kcal</span></div>
        ${p.tracker ? `
          ${macroRow('egg', 'Protein', today.protein, goal.protein, '#2E7D4F')}
          ${macroRow('cube', 'Carbs', today.carbs, goal.carbs, '#B5520B')}
          ${macroRow('drop', 'Fat', today.fat, goal.fat, '#3B6EA8')}
          <p class="flabel" style="margin-top:22px">This week (kcal from FoodAI meals)</p>
          <div class="week">${week.map((w) => `<div class="wcol"><span class="wval">${w.kcal || ''}</span>
            <div class="wbar${w.isToday ? ' today' : ''}" style="height:${w.kcal ? Math.max(6, Math.round((w.kcal / max) * 120)) : 2}px"></div>
            <span class="wlab">${'MTWTFSS'[week.indexOf(w)]}</span></div>`).join('')}</div>`
        : '<p class="muted" style="margin-top:14px">The macro tracker is off. Turn it on below if you want to follow what you eat.</p>'}
      </div>

      <div class="panel">
        <h2>Your diet</h2>
        <div class="chips">${[['omni', 'I eat everything'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan']].map(([v, l]) => chip(l, p.diet === v, () => commit((d) => { d.profile.diet = v; }))).join('')}</div>
        <p class="muted" style="margin-top:10px">We only suggest recipes that fit your diet.</p>
      </div>

      <div class="panel">
        <h2>Your goal</h2>
        <div class="chips">${Object.entries(GOALS).map(([v, g]) => chip(g.label, p.goal === v, () => commit((d) => { d.profile.goal = v; }))).join('')}</div>
        <p class="muted" style="margin-top:10px">Daily target: ${goal.kcal} kcal · ${goal.protein} g protein · ${goal.carbs} g carbs · ${goal.fat} g fat</p>
        <button class="setrow" style="margin-top:14px" aria-pressed="${p.tracker}" ${click(() => commit((d) => { d.profile.tracker = !d.profile.tracker; }))}>
          <span>Macro tracker<small>Shows protein, carbs and fat on every recipe</small></span>
          <span class="switch${p.tracker ? ' on' : ''}" aria-hidden="true"><i></i></span></button>
      </div>

      <div class="panel" style="grid-column:1/-1">
        <h2>Your data</h2>
        <p class="muted" style="margin:-6px 0 14px">Everything is saved in this browser only. Make a backup to move it to another device.</p>
        <div class="actions">
          <button class="btn" ${click(exportData)}>${icon('download')}Download backup</button>
          <label class="btn" style="cursor:pointer">${icon('upload')}Restore backup<input class="sr" type="file" accept="application/json,.json" ${change(importData)}></label>
          <button class="btn" ${click(() => { replaceData(demoData(p.name || 'Alex')); toast('Demo data loaded'); })}>Load demo data</button>
          ${ui.confirmReset
            ? `<span class="confirm">Delete everything?
                <button class="btn danger" ${click(() => { replaceData(emptyData()); setUI({ confirmReset: false }); toast('All data deleted'); navigate('home'); })}>Yes, delete</button>
                <button class="btn ghost" ${click(() => setUI({ confirmReset: false }))}>Cancel</button></span>`
            : `<button class="btn ghost" ${click(() => setUI({ confirmReset: true }))}>${icon('trash')}Delete all data</button>`}
        </div>
      </div>
    </div>
  </section>`;
}
