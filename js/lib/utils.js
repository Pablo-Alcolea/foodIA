// Small generic helpers.

/** Lowercase, trim and strip accents, for comparing names. */
export function norm(text) {
  return String(text ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Escape text before putting it into HTML. */
export function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

export function round(n, decimals = 1) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const UNITS = {
  pcs: { label: 'pcs', step: 1 },
  g: { label: 'g', step: 50 },
  ml: { label: 'ml', step: 100 },
  can: { label: 'cans', step: 1 },
  pack: { label: 'packs', step: 1 }
};

export function formatQty(qty, unit) {
  if (qty == null || qty === '') return '';
  if (unit === 'g' && qty >= 1000) return `${round(qty / 1000, 2)} kg`;
  if (unit === 'ml' && qty >= 1000) return `${round(qty / 1000, 2)} l`;
  if (unit === 'pcs') return `${qty} ${qty === 1 ? 'pc' : 'pcs'}`;
  if (unit === 'can') return `${qty} ${qty === 1 ? 'can' : 'cans'}`;
  if (unit === 'pack') return `${qty} ${qty === 1 ? 'pack' : 'packs'}`;
  return `${qty} ${unit}`;
}
