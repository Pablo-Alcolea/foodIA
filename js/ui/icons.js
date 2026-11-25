// Inline SVG icons (stroke style, 24×24). Usage: icon('heart', 'i s', 'fill:currentColor')

const PATHS = {
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c.6-3.8 3.7-6 7.5-6s6.9 2.2 7.5 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  fridge: '<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 10h12M9 5.5v2.5M9 13v3.5"/>',
  flame: '<path d="M12 3c1 3 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.6.3 1.6 1 2.6 2 3 0-3.4.2-6 1-8.4z"/>',
  hat: '<path d="M7 14.5V20h10v-5.5"/><path d="M7 14.5a4 4 0 0 1-.9-7.9A4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 5.9 2.6 4 4 0 0 1-.9 7.9z"/><path d="M7 17h10"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  egg: '<path d="M12 3c-3.6 0-6 5.6-6 9.6a6 6 0 0 0 12 0C18 8.6 15.6 3 12 3z"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cart: '<path d="M3 4h2.5l2.2 11h10.6L20.5 7H7"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
  pot: '<path d="M4 11h16v2a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z"/><path d="M2.5 11h19M9 7c-1-1.2 1-2 0-3.5M14 7c-1-1.2 1-2 0-3.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M10 3h4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  rotate: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'
};

export function icon(name, cls = 'i', style = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"${style ? ` style="${style}"` : ''}>${PATHS[name] || ''}</svg>`;
}

/** Star / heart that is filled when `on` is true. */
export function toggleIcon(name, on, cls = 'i') {
  return icon(name, cls, `fill:${on ? 'currentColor' : 'none'}`);
}

export const DISH = '<svg class="dish" viewBox="0 0 160 120" aria-hidden="true"><path d="M60 14c-4 6 4 10 0 16M80 8c-4 6 4 10 0 16M100 14c-4 6 4 10 0 16" fill="none" stroke="#1E2A22" stroke-width="3" stroke-linecap="round" opacity=".45"/><path d="M30 56c6-12 20-16 30-11 8-9 24-9 32 0 10-5 24-1 30 11" fill="#fff" fill-opacity=".55" stroke="#1E2A22" stroke-width="3" stroke-linecap="round"/><path d="M22 58h116c0 30-26 50-58 50S22 88 22 58z" fill="#fff" stroke="#1E2A22" stroke-width="3" stroke-linejoin="round"/><path d="M14 58h132" stroke="#1E2A22" stroke-width="3" stroke-linecap="round"/></svg>';
