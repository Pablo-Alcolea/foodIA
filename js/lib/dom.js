// Tiny event-binding layer for string templates.
//
// Views return HTML strings. To attach behaviour, a view calls e.g.
//   `<button ${click(() => doSomething())}>Go</button>`
// which stores the function and writes `data-click="7"` into the markup.
// main.js listens once on the document and calls the stored function.
// The registry is cleared on every render.

let handlers = [];

export function resetHandlers() {
  handlers = [];
}

function register(type, fn) {
  handlers.push(fn);
  return `data-${type}="${handlers.length - 1}"`;
}

export const click = (fn) => register('click', fn);
export const input = (fn) => register('input', fn);
export const change = (fn) => register('change', fn);
export const submit = (fn) => register('submit', fn);

export const EVENT_TYPES = ['click', 'input', 'change', 'submit'];

export function dispatch(type, event) {
  const el = event.target.closest?.(`[data-${type}]`);
  if (!el) return;
  if (type === 'submit') event.preventDefault();
  if (el.disabled) return;
  const fn = handlers[Number(el.dataset[type])];
  if (fn) fn(event, el);
}

/** Remember which input had focus so it survives a re-render. */
export function captureFocus() {
  const el = document.activeElement;
  if (!el || !el.id) return null;
  const info = { id: el.id };
  try { info.start = el.selectionStart; info.end = el.selectionEnd; } catch { /* not a text input */ }
  return info;
}

export function restoreFocus(info) {
  if (!info) return;
  const el = document.getElementById(info.id);
  if (!el) return;
  el.focus({ preventScroll: true });
  try { if (info.start != null) el.setSelectionRange(info.start, info.end); } catch { /* ignore */ }
}

/** Read a <form> into a plain object. */
export function formValues(form) {
  const out = {};
  new FormData(form).forEach((value, key) => { out[key] = value; });
  return out;
}
