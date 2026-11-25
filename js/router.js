// Hash router: #/fridge, #/recipe/spanish-omelette, …
// Using the hash means the phone's back button works and any static server can host the app.

export function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name = 'home', ...params] = hash.split('/').filter(Boolean).map(decodeURIComponent);
  return { name, params };
}

export function navigate(path) {
  const target = '#/' + path.replace(/^\/+/, '');
  if (location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = target;
  }
}

export function goBack(fallback = 'home') {
  if (history.length > 1) history.back();
  else navigate(fallback);
}
