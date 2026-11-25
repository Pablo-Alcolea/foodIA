import { data, ui, commit, setUI, toast } from '../store.js';
import { click, submit, formValues } from '../lib/dom.js';
import { esc, formatQty, UNITS, round } from '../lib/utils.js';
import { icon, toggleIcon } from '../ui/icons.js';
import { emptyState } from '../ui/components.js';
import { navigate } from '../router.js';
import { CATEGORIES, INGREDIENTS, ingredientInfo } from '../domain/catalog.js';
import { addItems, expiryStatus, isLow } from '../domain/fridge.js';

function updateItem(id, patch) {
  commit((d) => { d.fridge = d.fridge.map((i) => (i.id === id ? { ...i, ...patch } : i)); });
}

function removeItem(item) {
  commit((d) => { d.fridge = d.fridge.filter((i) => i.id !== item.id); });
  toast(`${item.name} removed from your fridge`);
}

function changeQty(item, direction) {
  const step = UNITS[item.unit]?.step || 1;
  const next = round((item.qty || 0) + direction * step, 2);
  if (next <= 0) { removeItem(item); return; }
  updateItem(item.id, { qty: next });
}

function addFromForm(event, form) {
  const v = formValues(form);
  const name = (v.name || '').trim();
  if (!name) { toast('Write the name of the ingredient'); return; }
  const info = ingredientInfo(name);
  commit((d) => {
    d.fridge = addItems(d.fridge, [{
      name,
      qty: v.qty === '' ? null : Number(v.qty),
      unit: v.unit || info?.unit || 'pcs',
      expires: v.expires || null,
      category: v.category === 'auto' ? undefined : v.category,
      basic: v.basic === 'on'
    }]);
  });
  form.reset();
  toast(`${info?.name || name} added to your fridge`);
  document.getElementById('add-name')?.focus();
}

function addForm() {
  const units = Object.entries(UNITS).map(([v, u]) => `<option value="${v}">${u.label}</option>`).join('');
  const cats = CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');
  return `<form class="panel addform" ${submit(addFromForm)}>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 style="margin:0">Add an ingredient</h2>
      <button type="button" class="mini" aria-label="Close" ${click(() => setUI({ fridgeForm: false }))}>${icon('x')}</button></div>
    <div class="fields">
      <label class="field grow"><span>Name</span><input id="add-name" name="name" list="ingredient-list" autocomplete="off" required placeholder="E.g. Eggs"></label>
      <label class="field small"><span>Qty</span><input name="qty" type="number" min="0" step="any" inputmode="decimal" placeholder="—"></label>
      <label class="field small"><span>Unit</span><select name="unit">${units}</select></label>
      <label class="field"><span>Expires</span><input name="expires" type="date"></label>
      <label class="field"><span>Category</span><select name="category"><option value="auto">Automatic</option>${cats}</select></label>
    </div>
    <label class="checkline"><input type="checkbox" name="basic"> Always have it at home (basic)</label>
    <button type="submit" class="btn primary">${icon('plus')}Add to fridge</button>
    <datalist id="ingredient-list">${INGREDIENTS.map((i) => `<option value="${esc(i.name)}">`).join('')}</datalist>
  </form>`;
}

function itemCard(item) {
  const exp = expiryStatus(item);
  const flag = exp && exp.level !== 'ok';
  return `<div class="item${flag ? ' exp' : ''}">
    <div class="row"><b>${esc(item.name)}</b>
      <span class="tools">
        <button class="mini${item.basic ? ' staron' : ''}" aria-pressed="${item.basic}" aria-label="${item.basic ? 'Remove from basics' : 'Mark as basic'}: ${esc(item.name)}"
          ${click(() => updateItem(item.id, { basic: !item.basic }))}>${toggleIcon('star', item.basic)}</button>
        <button class="mini" aria-label="Remove ${esc(item.name)} from the fridge" ${click(() => removeItem(item))}>${icon('trash')}</button>
      </span>
    </div>
    ${item.qty != null ? `<div class="qtyctl">
      <button class="mini" aria-label="Less ${esc(item.name)}" ${click(() => changeQty(item, -1))}>${icon('minus', 'i s')}</button>
      <span class="qty">${formatQty(item.qty, item.unit)}</span>
      <button class="mini" aria-label="More ${esc(item.name)}" ${click(() => changeQty(item, 1))}>${icon('plus', 'i s')}</button>
    </div>` : '<span class="qty">Quantity not set</span>'}
    ${flag ? `<span class="expb${exp.level === 'expired' ? ' bad' : ''}">${exp.text}</span>` : exp ? `<span class="qty">${exp.text}</span>` : ''}
    ${isLow(item) ? '<span class="qty" style="color:#9A4508;font-weight:600">Running low</span>' : ''}
  </div>`;
}

export function fridgeView() {
  const byExpiry = (a, b) => (a.expires || '9999') .localeCompare(b.expires || '9999');
  const groups = [{ title: 'Basics · always at home', items: data.fridge.filter((i) => i.basic) }]
    .concat(CATEGORIES.map((c) => ({ title: c.label, items: data.fridge.filter((i) => !i.basic && (i.category || 'other') === c.id) })))
    .filter((g) => g.items.length);
  const soon = data.fridge.filter((i) => { const s = expiryStatus(i); return s && s.level !== 'ok'; }).length;
  const toBuy = data.shopping.filter((s) => !s.done).length;

  return `<section aria-labelledby="h-fridge">
    <div class="headrow">
      <div><h1 id="h-fridge">Your fridge</h1><p class="sub">${data.fridge.length} ingredients · ${soon} expiring soon</p></div>
      <div class="actions">
        <button class="btn" ${click(() => setUI({ fridgeForm: !ui.fridgeForm }))}>${icon('plus')}Add</button>
        <button class="btn" ${click(() => navigate('scan'))}>${icon('camera')}Scan</button>
        <button class="btn primary" ${click(() => navigate('home'))}>${icon('pot')}What can I cook?</button>
      </div>
    </div>
    ${ui.fridgeForm ? addForm() : ''}
    <div class="split">
      <div class="main">
        ${groups.length ? groups.map((g) => `
          <div class="ghead"><h2>${g.title}</h2><span class="count">${g.items.length}</span></div>
          <div class="items">${g.items.slice().sort(byExpiry).map(itemCard).join('')}</div>`).join('')
        : emptyState('fridge', 'Your fridge is empty.', `<button class="btn primary" ${click(() => navigate('scan'))}>${icon('camera')}Scan</button><button class="btn" ${click(() => setUI({ fridgeForm: true }))}>${icon('plus')}Add by hand</button>`)}
        <p class="muted" style="margin-top:18px;display:flex;gap:8px;align-items:center">${icon('star', 'i s', 'fill:#B07800;color:#B07800')}Star what you always have (oil, salt, rice…). Basics are never removed when you cook.</p>
      </div>
      <aside class="side"><div class="panel">
        <h2 style="display:flex;align-items:center;gap:10px">${icon('cart')}Shopping list</h2>
        <p class="muted" style="margin:-6px 0 14px">${toBuy ? `${toBuy} ${toBuy === 1 ? 'item' : 'items'} to buy.` : 'Nothing on your list yet.'}</p>
        <button class="btn" ${click(() => navigate('shopping'))}>Open shopping list</button>
      </div></aside>
    </div>
  </section>`;
}
