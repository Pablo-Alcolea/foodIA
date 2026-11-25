// Scan screen: take a photo (camera on phones), recognise items, review, add to fridge.

import { ui, setUI, commit, refresh, toast } from '../store.js';
import { click, change, input, submit, formValues } from '../lib/dom.js';
import { esc, UNITS } from '../lib/utils.js';
import { addDays, todayISO } from '../lib/dates.js';
import { icon } from '../ui/icons.js';
import { backButton } from '../ui/components.js';
import { navigate } from '../router.js';
import { addItems } from '../domain/fridge.js';
import { INGREDIENTS, ingredientInfo } from '../domain/catalog.js';
import { recognizeIngredients, isDemoRecognition } from '../services/recognition.js';

function setScan(patch) {
  setUI({ scan: { ...ui.scan, ...patch } });
}

export function resetScan() {
  if (ui.scan.preview) URL.revokeObjectURL(ui.scan.preview);
  ui.scan = { mode: ui.scan.mode, status: 'idle', items: [], preview: null, error: null };
}

async function handleFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (ui.scan.preview) URL.revokeObjectURL(ui.scan.preview);
  setScan({ status: 'working', preview: URL.createObjectURL(file), error: null, items: [] });
  try {
    const found = await recognizeIngredients(file, ui.scan.mode);
    const items = found.map((f) => ({
      name: f.name,
      qty: f.qty ?? '',
      unit: f.unit || ingredientInfo(f.name)?.unit || 'pcs',
      expires: f.expiresInDays != null ? addDays(todayISO(), f.expiresInDays) : '',
      keep: true
    }));
    setScan({ status: 'review', items });
  } catch (err) {
    console.error(err);
    setScan({ status: 'error', error: err.message || 'Something went wrong.' });
  }
}

/** Copy what the user typed in the review form back into ui.scan.items. */
function syncForm() {
  const form = document.getElementById('scan-form');
  if (!form) return;
  const v = formValues(form);
  ui.scan.items = ui.scan.items.map((item, i) => ({
    name: v[`name-${i}`] ?? item.name,
    qty: v[`qty-${i}`] ?? item.qty,
    unit: v[`unit-${i}`] ?? item.unit,
    expires: v[`exp-${i}`] ?? item.expires,
    keep: v[`keep-${i}`] === 'on'
  }));
}

function confirm() {
  syncForm();
  const chosen = ui.scan.items.filter((i) => i.keep && i.name.trim());
  if (!chosen.length) { toast('Choose at least one item'); return; }
  commit((d) => { d.fridge = addItems(d.fridge, chosen); });
  resetScan();
  navigate('fridge');
  toast(`Added ${chosen.length} ${chosen.length === 1 ? 'item' : 'items'} to your fridge`);
}

function unitOptions(selected) {
  return Object.entries(UNITS).map(([value, u]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${u.label}</option>`).join('');
}

function reviewForm() {
  const rows = ui.scan.items.map((item, i) => `
    <div class="reviewrow${item.keep ? '' : ' off'}">
      <label class="checkwrap"><input type="checkbox" name="keep-${i}" ${item.keep ? 'checked' : ''}><span class="sr">Keep this item</span></label>
      <div class="fields">
        <label class="field grow"><span>Item</span><input id="scan-name-${i}" name="name-${i}" value="${esc(item.name)}" list="ingredient-list" autocomplete="off"></label>
        <label class="field small"><span>Qty</span><input id="scan-qty-${i}" name="qty-${i}" type="number" min="0" step="any" inputmode="decimal" value="${esc(item.qty)}"></label>
        <label class="field small"><span>Unit</span><select name="unit-${i}">${unitOptions(item.unit)}</select></label>
        <label class="field"><span>Expires</span><input name="exp-${i}" type="date" value="${esc(item.expires)}"></label>
      </div>
    </div>`).join('');
  // Keep typed edits in ui.scan so they survive any re-render.
  return `<form id="scan-form" class="det" ${submit(confirm)} ${input(syncForm)} ${change((e) => { syncForm(); if (e.target.type === 'checkbox') refresh(); })}>
    ${rows}
    <button type="button" class="btn ghost" ${click(() => { syncForm(); ui.scan.items.push({ name: '', qty: '', unit: 'pcs', expires: '', keep: true }); refresh(); })}>${icon('plus')}Add another item</button>
    <button type="submit" class="btn primary big" style="width:100%">Add to the fridge</button>
  </form>`;
}

export function scanView() {
  const s = ui.scan;
  const seg = (mode, label) => `<button type="button" class="${s.mode === mode ? 'on' : ''}" aria-pressed="${s.mode === mode}" ${click(() => { resetScan(); setScan({ mode }); })}>${label}</button>`;

  let finder;
  if (s.status === 'idle' || s.status === 'error') {
    finder = `<p class="vfh">${s.mode === 'fridge' ? 'Open the fridge and frame the shelves.' : 'Hold the receipt straight and in good light.'}</p>
      <label class="shutter" aria-label="Take a photo">${icon('camera')}
        <input class="sr" type="file" accept="image/*" capture="environment" ${change(handleFile)}></label>
      <label class="btn" style="background:transparent;color:#fff;border-color:#fff;cursor:pointer">${icon('image')}Choose from gallery
        <input class="sr" type="file" accept="image/*" ${change(handleFile)}></label>`;
  } else {
    finder = `<img class="preview" src="${s.preview}" alt="Your photo">
      ${s.status === 'working' ? '<div class="scrim"><span class="spinner" aria-hidden="true"></span><p>Recognising ingredients…</p></div>' : ''}`;
  }

  let side;
  if (s.status === 'idle') {
    side = `<p class="muted">After you take the photo you'll see what we recognised here. You can fix anything before it goes into your fridge.</p>`;
  } else if (s.status === 'working') {
    side = '<p class="muted" aria-live="polite">Looking at your photo…</p>';
  } else if (s.status === 'error') {
    side = `<div class="note warn">${icon('alert', 'i s')}<span>${esc(s.error)}</span></div><p class="muted">Try another photo, or add items by hand from the fridge.</p>`;
  } else {
    side = `${reviewForm()}
      <button class="btn ghost" style="margin-top:8px" ${click(() => { resetScan(); refresh(); })}>${icon('camera')}Take another photo</button>`;
  }

  return `<section aria-labelledby="h-scan">
    ${backButton()}
    <div class="headrow">
      <div><h1 id="h-scan">Fill your fridge</h1><p class="sub">Take a photo and FoodAI recognises what you have.</p></div>
      <div class="seg" role="group" aria-label="What are you scanning">${seg('fridge', 'Fridge')}${seg('receipt', 'Receipt')}</div>
    </div>
    ${isDemoRecognition() ? `<div class="note">${icon('alert', 'i s')}<span><b>Demo recognition:</b> the photo is real, but the items found are samples until you connect a recognition service (see README).</span></div>` : ''}
    <div class="split">
      <div class="main"><div class="viewfinder">
        <span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
        ${finder}
      </div></div>
      <div class="side"><div class="panel"><h2>Items found</h2>${side}</div></div>
    </div>
    <datalist id="ingredient-list">${INGREDIENTS.map((i) => `<option value="${esc(i.name)}">`).join('')}</datalist>
  </section>`;
}
