// Streaks, cooking levels and macro totals, all computed from the history.

import { addDays, currentWeek, todayISO } from '../lib/dates.js';

export const LEVELS = [
  null,
  { name: 'Beginner', min: 0, desc: 'Basic recipes' },
  { name: 'Home cook', min: 200, desc: 'Two-pan recipes' },
  { name: 'Chef', min: 500, desc: 'Chef techniques' }
];

export const GOALS = {
  maintain: { label: 'Maintain', kcal: 2200, protein: 110, carbs: 250, fat: 70 },
  muscle: { label: 'Build muscle', kcal: 2600, protein: 140, carbs: 300, fat: 80 },
  lose: { label: 'Lose weight', kcal: 1800, protein: 110, carbs: 180, fat: 60 }
};

export function levelOf(xp) {
  if (xp >= LEVELS[3].min) return 3;
  if (xp >= LEVELS[2].min) return 2;
  return 1;
}

export function levelProgress(xp) {
  const lvl = levelOf(xp);
  if (lvl === 3) return { lvl, pct: 100, toNext: 0 };
  const from = LEVELS[lvl].min;
  const to = LEVELS[lvl + 1].min;
  return { lvl, pct: Math.round(((xp - from) / (to - from)) * 100), toNext: to - xp };
}

function cookedDates(history) {
  return new Set(history.map((h) => h.date));
}

/** Days in a row with at least one cooked recipe, counting today or yesterday. */
export function currentStreak(history) {
  const dates = cookedDates(history);
  const today = todayISO();
  let day = dates.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (dates.has(day)) { n++; day = addDays(day, -1); }
  return n;
}

export function bestStreak(history) {
  const dates = [...cookedDates(history)].sort();
  let best = 0, run = 0, prev = null;
  dates.forEach((d) => {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  });
  return best;
}

export function cookedToday(history) {
  return history.some((h) => h.date === todayISO());
}

export function entriesOn(history, date) {
  return history.filter((h) => h.date === date);
}

export function totalsOn(history, date) {
  return entriesOn(history, date).reduce(
    (t, h) => ({ kcal: t.kcal + h.kcal, protein: t.protein + h.protein, carbs: t.carbs + h.carbs, fat: t.fat + h.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function weekKcal(history) {
  const today = todayISO();
  return currentWeek().map((date) => ({ date, kcal: totalsOn(history, date).kcal, isToday: date === today, future: date > today }));
}
