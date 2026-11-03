import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
const activeCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function blockFromMarker(source, marker, label) {
  const match = marker.exec(source);
  assert.ok(match, `${label} must exist`);
  const openingBrace = source.indexOf('{', match.index);
  let depth = 1;

  for (let index = openingBrace + 1; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  assert.fail(`${label} must have a closing brace`);
}

test('defines the exact approved navy and teal palette', () => {
  const tokens = {
    '--navy': '#0a1628',
    '--blue': '#0a2f4d',
    '--teal': '#1e9aa2',
    '--cyan': '#22d3ee',
    '--white': '#ffffff',
    '--muted': '#6b7280',
  };

  const root = blockFromMarker(activeCss, /^\s*:root\s*\{/m, ':root');
  for (const [name, value] of Object.entries(tokens)) {
    const declarations = [...root.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, 'gi'))];
    assert.equal(declarations.length, 1, `${name} must be declared exactly once in :root`);
    assert.equal(declarations[0][1].trim().toLowerCase(), value);
  }
});

test('uses the reference desktop proportions', () => {
  assert.match(activeCss, /\.hero-content\s*\{[^}]*grid-template-columns\s*:\s*42%\s+58%/is);
  assert.match(activeCss, /\.system-list\s*\{[^}]*grid-template-columns\s*:\s*repeat\(2\s*,\s*minmax\(0\s*,\s*1fr\)\)/is);
  assert.match(activeCss, /\.faq-contact-layout\s*\{[^}]*display\s*:\s*grid/is);
  assert.match(activeCss, /\.footer-grid\s*\{[^}]*grid-template-columns\s*:/is);
});

test('stacks reference sections on mobile without horizontal overflow', () => {
  assert.match(activeCss, /body\s*\{[^}]*overflow-x\s*:\s*(?:clip|hidden)/is);
  const mobile = blockFromMarker(
    activeCss,
    /@media\s*\(max-width:\s*760px\)\s*\{/i,
    '760px mobile breakpoint',
  );
  assert.match(mobile, /\.hero-content\s*\{[^}]*grid-template-columns\s*:\s*1fr/is);
  assert.match(mobile, /\.system-list\s*\{[^}]*grid-template-columns\s*:\s*1fr/is);
  assert.match(mobile, /\.faq-contact-layout\s*\{[^}]*grid-template-columns\s*:\s*1fr/is);
});

test('contains no styling for removed visualization components', () => {
  assert.doesNotMatch(activeCss, /\.system-map\b|\.achievement-orbit\b|\.hero-impact\b/);
});

test('uses flat surfaces and keeps every radius at six pixels or less', () => {
  assert.doesNotMatch(activeCss, /(?:linear|radial|conic)-gradient\s*\(/i);
  assert.match(activeCss, /--radius\s*:\s*6px\s*;/i);
  for (const match of activeCss.matchAll(/border-radius\s*:\s*(\d+(?:\.\d+)?)px/gi)) {
    assert.ok(Number(match[1]) <= 6, 'border radius exceeds 6px');
  }
});

test('uses contrast-safe text and hover colors on light surfaces', () => {
  const safeTextSelectors = [
    /\.eyebrow[^\{]*\{[^}]*color\s*:\s*var\(--(?:blue|navy)\)/is,
    /\.hero-role\s*\{[^}]*color\s*:\s*var\(--(?:blue|navy)\)/is,
    /\.system-action\s*\{[^}]*color\s*:\s*var\(--(?:blue|navy)\)/is,
    /\.timeline\s+time\s*\{[^}]*color\s*:\s*var\(--(?:blue|navy)\)/is,
    /\.project-actions\s+a\s*\{[^}]*color\s*:\s*var\(--(?:blue|navy)\)/is,
  ];
  for (const pattern of safeTextSelectors) assert.match(activeCss, pattern);
  assert.match(activeCss, /\.button-primary:hover\s*\{[^}]*background\s*:\s*var\(--(?:blue|navy)\)[^}]*color\s*:\s*var\(--white\)/is);
  assert.match(activeCss, /\.nav-links\s+\.nav-contact:hover\s*\{[^}]*background\s*:\s*var\(--(?:blue|navy)\)[^}]*color\s*:\s*var\(--white\)/is);
  assert.match(activeCss, /\.dialog-close:hover\s*\{[^}]*background\s*:\s*var\(--(?:blue|navy)\)[^}]*color\s*:\s*var\(--white\)/is);
});

test('normal text color pairs meet WCAG AA contrast', () => {
  const root = blockFromMarker(activeCss, /^\s*:root\s*\{/m, ':root');
  const tokens = Object.fromEntries(
    [...root.matchAll(/(--[\w-]+)\s*:\s*(#[a-f\d]{6})\s*;/gi)]
      .map(([, name, value]) => [name, value]),
  );
  const pairs = [
    ['--ink', '--white'],
    ['--muted', '--white'],
    ['--blue', '--white'],
    ['--white', '--navy'],
    ['--cyan', '--navy'],
    ['--blue', '--pale'],
  ];
  for (const [foreground, background] of pairs) {
    assert.ok(
      contrast(tokens[foreground], tokens[background]) >= 4.5,
      foreground + ' on ' + background + ' must meet 4.5:1',
    );
  }
  assert.match(activeCss, /\.timeline-item--current\s+time[^{]*\{[^}]*color\s*:\s*var\(--blue\)/is);
  assert.match(activeCss, /\.timeline-item--current\s+\.experience-points\s*\{[^}]*color\s*:\s*var\(--blue\)/is);
});

test('contains no dead section-heading or systems paragraph selectors', () => {
  assert.doesNotMatch(activeCss, /\.section-heading--solo\s*\{/i);
  assert.doesNotMatch(activeCss, /\.systems\s+\.section-heading\s+p\b/i);
});

test('preserves accessible controls and reduced motion', () => {
  assert.match(activeCss, /:focus-visible\s*\{[^}]*outline\s*:\s*3px\s+solid\s+var\(--navy\)/is);
  assert.match(activeCss, /:focus-visible\s*\{[^}]*box-shadow\s*:[^;}]*var\(--cyan\)/is);
  assert.match(activeCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/i);
});

test('gives every interactive control family at least a 44px target', () => {
  const selectors = [
    ['button', /\.button\s*\{[^}]*min-height\s*:\s*44px/is],
    ['brand link', /\.brand\s*\{[^}]*min-height\s*:\s*44px/is],
    ['navigation link', /\.nav-links\s+a\s*\{[^}]*min-height\s*:\s*44px/is],
    ['navigation contact', /\.nav-links\s+\.nav-contact\s*\{[^}]*min-height\s*:\s*44px/is],
    ['navigation toggle', /\.nav-toggle\s*\{[^}]*height\s*:\s*44px/is],
    ['hero capability link', /\.hero-specialties\s+a\s*\{[^}]*min-height\s*:\s*44px/is],
    ['system action', /\.system-action\s*\{[^}]*min-height\s*:\s*44px/is],
    ['capability summary', /\.capability-group\s+summary\s*\{[^}]*min-height\s*:\s*(?:4[4-9]|[5-9]\d)px/is],
    ['project action', /\.project-actions\s+a\s*\{[^}]*min-height\s*:\s*44px/is],
    ['FAQ summary', /\.faq-item\s+summary\s*\{[^}]*min-height\s*:\s*(?:4[4-9]|[5-9]\d)px/is],
    ['employer link', /\.timeline-company\s+a\s*\{[^}]*min-height\s*:\s*44px/is],
    ['contact link', /\.contact-details\s+a\s*\{[^}]*min-height\s*:\s*44px/is],
    ['footer link', /\.footer-grid\s+a\s*\{[^}]*min-height\s*:\s*44px/is],
    ['dialog close', /\.dialog-close\s*\{[^}]*height\s*:\s*44px/is],
  ];

  for (const [label, pattern] of selectors) {
    assert.match(activeCss, pattern, label + ' must have a minimum 44px target');
  }
});

test('collapses navigation at the JavaScript breakpoint and preserves 760px content stacking', () => {
  const navigation = blockFromMarker(
    activeCss,
    /@media\s*\(max-width:\s*900px\)\s*\{/i,
    '900px navigation breakpoint',
  );
  assert.match(navigation, /\.nav-ready\s+\.nav-toggle:not\(\[hidden\]\)\s*\{[^}]*display\s*:\s*block/is);
  assert.match(navigation, /\.nav-ready\s+\.nav-links\s*\{[^}]*display\s*:\s*none/is);
  assert.match(navigation, /\.nav-ready\s+\.nav-links\.is-open\s*\{[^}]*display\s*:\s*flex/is);
  assert.match(navigation, /\.nav-links\s+\.nav-contact\s*\{[^}]*min-height\s*:\s*48px/is);

  const mobile = blockFromMarker(
    activeCss,
    /@media\s*\(max-width:\s*760px\)\s*\{/i,
    '760px mobile breakpoint',
  );
  assert.doesNotMatch(mobile, /\.nav-toggle|\.nav-links/);
  assert.match(mobile, /\.hero-content\s*\{[^}]*grid-template-columns\s*:\s*1fr/is);
});

test('reveal content is visible until enhancement setup succeeds', () => {
  assert.match(activeCss, /\[data-reveal\]\s*\{[^}]*opacity\s*:\s*1/is);
  assert.match(activeCss, /\.reveal-ready\s+\[data-reveal\]\s*\{[^}]*opacity\s*:\s*0/is);
});

test('provides hover feedback for compact icon controls', () => {
  assert.match(activeCss, /\.nav-toggle:hover\s*\{/i);
  assert.match(activeCss, /\.dialog-close:hover\s*\{/i);
});
