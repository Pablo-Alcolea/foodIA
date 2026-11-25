// Cooking mode: one step at a time, kitchen timer, and updating the fridge at the end.

import { data, ui, commit, setUI, toast } from '../store.js';
import { click } from '../lib/dom.js';
import { esc, formatTimer, uid } from '../lib/utils.js';
import { todayISO } from '../lib/dates.js';
import { icon } from '../ui/icons.js';
import { emptyState } from '../ui/components.js';
import { navigate } from '../router.js';
import { findRecipe } from '../domain/catalog.js';
import { consumeRecipe } from '../domain/fridge.js';
import { LEVELS, levelOf } from '../domain/stats.js';
import { POINTS_PER_LEVEL } from '../config.js';
import { portionsFor } from './recipe.js';

let interval = null;
let wakeLock = null;

export function stopCooking() {
  clearInterval(interval);
  interval = null;
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

async function keepScreenOn() {
  try {
    if ('wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen');
  } catch { /* not supported or not allowed: fine */ }
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.3);
    });
  } catch { /* no audio */ }
  if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
}

function setCook(patch) {
  setUI({ cook: { ...ui.cook, ...patch } });
}

function goToStep(recipe, step) {
  clearInterval(interval);
  interval = null;
  setCook({ step, timeLeft: recipe.steps[step].timer || 0, running: false });
}

function toggleTimer(recipe) {
  const c = ui.cook;
  if (c.running) {
    clearInterval(interval);
    interval = null;
    setCook({ running: false });
    return;
  }
  const full = recipe.steps[c.step].timer || 0;
  setCook({ running: true, timeLeft: c.timeLeft > 0 ? c.timeLeft : full });
  interval = setInterval(() => {
    const left = ui.cook.timeLeft - 1;
    if (left <= 0) {
      clearInterval(interval);
      interval = null;
      setCook({ timeLeft: 0, running: false });
      beep();
      toast('Time is up! You can go to the next step.');
    } else {
      setCook({ timeLeft: left });
    }
  }, 1000);
}

function finish(recipe) {
  const portions = portionsFor(recipe.id);
  const before = levelOf(data.xp);
  const points = POINTS_PER_LEVEL * recipe.level;
  let usedUp = [];
  commit((d) => {
    const result = consumeRecipe(d.fridge, recipe, portions);
    d.fridge = result.fridge;
    usedUp = result.usedUp;
    const n = recipe.nutrition;
    d.history.push({
      id: uid(), date: todayISO(), recipeId: recipe.id, portions,
      kcal: n.kcal * portions, protein: n.protein * portions, carbs: n.carbs * portions, fat: n.fat * portions
    });
    d.xp += points;
  });
  stopCooking();
  ui.cook = null;
  ui.calDay = todayISO();
  navigate('calendar');
  const after = levelOf(data.xp);
  if (after > before) toast(`You reached the ${LEVELS[after].name} level! New recipes unlocked.`);
  else toast(`Well done! +${points} points.${usedUp.length ? ` Used up: ${usedUp.join(', ')}.` : ' Fridge updated.'}`);
}

export function cookView(id) {
  const recipe = findRecipe(id);
  if (!recipe) return emptyState('search', 'This recipe does not exist.');
  if (!ui.cook || ui.cook.recipeId !== id) {
    stopCooking();
    ui.cook = { recipeId: id, step: 0, timeLeft: recipe.steps[0].timer || 0, running: false };
  }
  keepScreenOn();

  const c = ui.cook;
  const step = recipe.steps[c.step];
  const last = c.step === recipe.steps.length - 1;
  const pct = Math.round(((c.step + 1) / recipe.steps.length) * 100);
  const full = step.timer || 0;
  const timerLabel = c.running ? 'Pause' : c.timeLeft === 0 ? 'Start again' : c.timeLeft === full ? 'Start' : 'Resume';

  return `<section aria-labelledby="h-cook">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <button class="btn ghost" ${click(() => { stopCooking(); ui.cook = null; navigate(`recipe/${id}`); })}>${icon('x')}Exit</button>
      <p style="font-weight:600;color:#5B665E">Step ${c.step + 1} of ${recipe.steps.length}</p>
    </div>
    <h1 id="h-cook" style="margin-top:8px;font-size:30px">${esc(recipe.name)}</h1>
    <div class="progress" role="progressbar" aria-label="Recipe progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div style="width:${pct}%"></div></div>
    <div class="cook">
      <div class="stepcard">
        <p class="stepnum">Step ${c.step + 1}</p>
        <p class="steptext" aria-live="polite">${esc(step.text)}</p>
        ${step.timer ? `<div class="timer">
          <span class="tl">${icon('timer', 'i s')}Kitchen timer</span>
          <span class="t${c.running ? ' run' : ''}" role="timer">${formatTimer(c.timeLeft)}</span>
          <button class="btn dark" ${click(() => toggleTimer(recipe))}>${timerLabel}</button>
          <button class="btn ghost" ${click(() => goToStep(recipe, c.step))}>Reset</button>
        </div>` : ''}
        <div class="stepnav">
          <button class="btn" ${c.step === 0 ? 'disabled' : ''} ${click(() => goToStep(recipe, c.step - 1))}>${icon('back')}Previous</button>
          ${last
            ? `<button class="btn primary big" ${click(() => finish(recipe))}>${icon('check')}Finished! It's ready</button>`
            : `<button class="btn primary big" ${click(() => goToStep(recipe, c.step + 1))}>Done, next step${icon('next')}</button>`}
        </div>
      </div>
      <div class="panel">
        <h2>Step list</h2>
        <ol class="checklist">${recipe.steps.map((s, i) => `
          <li><button class="citem${i < c.step ? ' done' : i === c.step ? ' current' : ''}"${i === c.step ? ' aria-current="step"' : ''} ${click(() => goToStep(recipe, i))}>
            <span class="circ">${i < c.step ? '✓' : ''}</span><span>${esc(s.text)}</span>
          </button></li>`).join('')}
        </ol>
        <p class="muted" style="margin-top:14px">When you finish, we take what you used out of your fridge.</p>
      </div>
    </div>
  </section>`;
}
