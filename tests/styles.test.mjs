import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const stylesheetUrl = new URL('../assets/css/styles.css', import.meta.url);
const stylesheetExists = existsSync(stylesheetUrl);
const css = stylesheetExists ? readFileSync(stylesheetUrl, 'utf8') : '';
const prohibitedDecorativePattern = /\b(?:orbs?|bokeh)\b|\.(?:orb|bokeh)[\w-]*/i;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizedSelectorParts(selector) {
  return selector
    .split(',')
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .sort();
}

function styleRules(source = css) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selector, body]) => ({
      body,
      selector: selector.trim(),
      selectorParts: normalizedSelectorParts(selector),
    }))
    .filter(({ selector }) => !selector.startsWith('@'));
}

function matchingRuleBodies(selector, source = css) {
  const expectedParts = normalizedSelectorParts(selector);
  return styleRules(source)
    .filter(({ selectorParts }) => {
      return expectedParts.every((part) => selectorParts.includes(part));
    })
    .map(({ body }) => body);
}

function exactRuleBodies(selector, source = css) {
  const expectedParts = normalizedSelectorParts(selector);
  return styleRules(source)
    .filter(({ selectorParts }) => {
      return (
        selectorParts.length === expectedParts.length &&
        expectedParts.every((part, index) => selectorParts[index] === part)
      );
    })
    .map(({ body }) => body);
}

function ruleBody(selector, source = css) {
  const bodies = exactRuleBodies(selector, source);
  assert.ok(bodies.length > 0, `expected CSS rule for ${selector}`);
  return bodies[0];
}

function declarationValue(body, property) {
  return body.match(
    new RegExp(`(?:^|;)\\s*${escapeRegExp(property)}\\s*:\\s*([^;]+)`, 'm'),
  )?.[1].trim();
}

function assertDeclaration(selector, property, expected, source = css) {
  const values = matchingRuleBodies(selector, source)
    .map((body) => declarationValue(body, property))
    .filter((value) => value !== undefined);
  assert.ok(
    values.includes(expected),
    `${selector} must declare ${property}: ${expected}; found ${values.join(', ') || 'none'}`,
  );
}

function literalBorderRadii(source) {
  return [
    ...source.matchAll(
      /(?:^|[;{])\s*border-radius\s*:\s*([^;{}]+)(?=;|})/gim,
    ),
  ].map(([, value]) => value.trim());
}

function atRuleBody(marker) {
  const markerIndex = css.indexOf(marker);
  assert.notEqual(markerIndex, -1, `expected ${marker}`);
  const openingBrace = css.indexOf('{', markerIndex + marker.length);
  assert.notEqual(openingBrace, -1, `expected a block for ${marker}`);

  let depth = 1;
  for (let index = openingBrace + 1; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') depth -= 1;
    if (depth === 0) return css.slice(openingBrace + 1, index);
  }

  assert.fail(`expected a closing brace for ${marker}`);
}

test('provides the portfolio stylesheet', () => {
  assert.ok(stylesheetExists, 'assets/css/styles.css must exist');
});

test('defines the exact executive editorial design tokens', () => {
  const expectedTokens = {
    '--canvas': '#f2f0e9',
    '--paper': '#fbfaf6',
    '--ink': '#15191b',
    '--ink-soft': '#59635f',
    '--surface-dark': '#121a1b',
    '--surface-dark-soft': '#1d2928',
    '--teal': '#08705e',
    '--teal-bright': '#6ce1bf',
    '--mint': '#d9f2e9',
    '--gold': '#c49a2f',
    '--rule': 'rgba(21, 25, 27, 0.17)',
    '--rule-light': 'rgba(255, 255, 255, 0.15)',
    '--radius': '6px',
    '--content': '1180px',
    '--header-height': '72px',
  };
  const declarations = Object.fromEntries(
    [...ruleBody(':root').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
      ([, name, value]) => [name, value.trim()],
    ),
  );

  assert.deepEqual(declarations, expectedTokens);
});

test('includes the global layout, typography, and control selectors', () => {
  const selectors = [
    '*,\n*::before,\n*::after',
    'html',
    'body',
    'body:has(dialog[open])',
    'a',
    'button',
    'canvas',
    ':focus-visible',
    '.skip-link',
    '.skip-link:focus',
    '.content-shell',
    '.eyebrow',
    'h1,\nh2,\nh3,\np',
    'h1,\nh2,\nh3',
    'h1',
    'h2',
    'h3',
    '.section-heading',
    '.section-heading--solo',
    '.button',
    '.button-primary',
    '.button-secondary',
  ];

  for (const selector of selectors) ruleBody(selector);
  assertDeclaration('body', 'margin', '0');
  assertDeclaration('body', 'overflow-x', 'clip');
  assertDeclaration('.skip-link:focus', 'top', '12px');
});

test('uses a two-color focus indicator and preserves control target sizes', () => {
  assertDeclaration(':focus-visible', 'outline', '2px solid var(--paper)');
  assertDeclaration(':focus-visible', 'outline-offset', '2px');
  assertDeclaration(':focus-visible', 'box-shadow', '0 0 0 6px var(--ink)');
  assertDeclaration('.button', 'min-height', '44px');
  assertDeclaration('.nav-toggle', 'width', '44px');
  assertDeclaration('.nav-toggle', 'height', '44px');
  assertDeclaration('.dialog-close', 'width', '44px');
  assertDeclaration('.dialog-close', 'height', '44px');
});

test('gives the navigation conversation action a clear filled treatment', () => {
  assertDeclaration('.nav-contact', 'border', '1px solid var(--ink)');
  assertDeclaration('.nav-contact', 'background', 'var(--ink)');
  assertDeclaration('.nav-contact', 'color', '#fff');
});

test('uses intrinsic-safe editorial columns and content children', () => {
  assertDeclaration(
    '.section-heading',
    'grid-template-columns',
    'minmax(0, 0.8fr) minmax(0, 1.4fr)',
  );
  assertDeclaration('.section-heading > *', 'min-width', '0');
  assertDeclaration('.experience-layout > *', 'min-width', '0');

  const actionChildren = [
    '.hero-actions > *',
    '.social-links > *',
    '.project-actions > *',
    '.resume-actions > *',
  ];
  for (const selector of actionChildren) {
    assertDeclaration(selector, 'min-width', '0');
    assertDeclaration(selector, 'overflow-wrap', 'anywhere');
  }
});

test('shares the wrapping layout across every action group', () => {
  const actionGroups = [
    '.hero-actions',
    '.social-links',
    '.project-actions',
    '.resume-actions',
  ];

  for (const selector of actionGroups) {
    assertDeclaration(selector, 'display', 'flex');
    assertDeclaration(selector, 'flex-wrap', 'wrap');
    assertDeclaration(selector, 'align-items', 'center');
    assertDeclaration(selector, 'gap', '12px 18px');
  }
});

test('uses a fluid in-flow grid for hero copy and the system map', () => {
  assertDeclaration('.hero-content', 'display', 'grid');
  assertDeclaration(
    '.hero-content',
    'grid-template-columns',
    'minmax(0, 1.08fr) minmax(320px, 0.92fr)',
  );
  assertDeclaration('.hero-content', 'align-items', 'center');
  assert.match(declarationValue(ruleBody('.hero-content'), 'gap'), /^clamp\(/);
  assertDeclaration('.hero-copy', 'min-width', '0');
  assertDeclaration('h1', 'width', '100%');
  assertDeclaration('.hero-summary', 'width', '100%');
  assertDeclaration('.hero-actions', 'width', '100%');
  assertDeclaration('.system-map', 'position', 'relative');
  assertDeclaration('.system-visual', 'position', 'relative');
  assertDeclaration('.system-visual', 'aspect-ratio', '1');
  assertDeclaration('.system-map', 'width', '100%');
  assertDeclaration('.system-map', 'aspect-ratio', '1');
  for (const offset of ['top', 'right', 'bottom', 'left']) {
    assert.equal(declarationValue(ruleBody('.system-map'), offset), undefined);
  }

  const tablet = atRuleBody('@media (max-width: 900px)');
  assertDeclaration('.hero-content', 'grid-template-columns', '1fr', tablet);
  const mobile = atRuleBody('@media (max-width: 600px)');
  assertDeclaration('.system-map', 'width', 'min(62vw, 220px)', mobile);
  assertDeclaration('.achievement-orbit', 'position', 'static', mobile);
  assertDeclaration('.achievement-orbit', 'grid-template-columns', 'repeat(2, minmax(0, 1fr))', mobile);
});

test('covers every desktop component surface', () => {
  const selectors = [
    '.site-header',
    '.site-header.is-scrolled',
    '.site-header nav',
    '.brand',
    '.nav-links',
    '.nav-contact',
    '.nav-toggle',
    '.nav-toggle[hidden]',
    '.hero',
    '.hero-content',
    '.hero-copy',
    '.hero-identity',
    '.hero-profile',
    '.hero-name',
    '.hero-summary',
    '.hero-actions',
    '.social-links',
    '.system-visual',
    '.system-map',
    '.achievement-connectors',
    '.achievement-connectors path',
    '.achievement-connectors circle',
    '.achievement-orbit',
    '.achievement',
    '.achievement strong',
    '.achievement span',
    '.section',
    '.systems',
    '.system-list',
    '.system-row',
    '.system-action',
    '.projects',
    '.project-list',
    '.project',
    '.project-visual',
    '.project-copy',
    '.project-copy > p:not(.eyebrow)',
    '.project-actions a',
    '.text-link',
    '.expertise',
    '.expertise-grid',
    '.experience-layout',
    '.timeline',
    '.resume',
    '.resume-grid',
    '.resume-actions',
    '.site-footer',
    '.site-footer .content-shell',
    'dialog',
    'dialog::backdrop',
    '.dialog-panel',
    '.dialog-close',
    '.dialog-metric',
    '.dialog-section',
  ];

  for (const selector of selectors) ruleBody(selector);
  assertDeclaration('.system-index', 'font-weight', '800');
});

test('places achievements around the system visualization and reflows them on mobile', () => {
  assertDeclaration('.achievement-orbit', 'position', 'absolute');
  assertDeclaration('.achievement', 'position', 'absolute');
  const mobile = atRuleBody('@media (max-width: 600px)');
  assertDeclaration('.achievement-orbit', 'position', 'static', mobile);
  assertDeclaration('.achievement', 'position', 'relative', mobile);
});

test('presents engineering capabilities as a responsive recruiter-friendly matrix', () => {
  assertDeclaration('.expertise', 'background', 'var(--paper)');
  assertDeclaration('.expertise', 'color', 'var(--ink)');
  assertDeclaration('.expertise-grid', 'grid-template-columns', 'repeat(2, minmax(0, 1fr))');
  assertDeclaration('.capability-group', 'min-width', '0');
  assertDeclaration('.capability-group h3', 'color', 'var(--teal)');

  const mobile = atRuleBody('@media (max-width: 600px)');
  assertDeclaration('.expertise-grid', 'grid-template-columns', '1fr', mobile);
});

test('stacks heading layouts before their text can outgrow parent tracks', () => {
  const editorial = atRuleBody('@media (max-width: 760px)');

  assertDeclaration('.experience-layout', 'display', 'block');
  assertDeclaration('.timeline', 'grid-template-columns', '1fr');
  assertDeclaration(
    '.timeline > li',
    'grid-template-columns',
    'minmax(210px, 0.72fr) minmax(0, 1.28fr)',
  );
  assertDeclaration('.experience-layout > .section-heading h2', 'max-width', 'none');

  assertDeclaration('.section-heading', 'grid-template-columns', '1fr', editorial);
  assertDeclaration('.section-heading', 'gap', '16px', editorial);
  assertDeclaration('.section-heading', 'margin-bottom', '44px', editorial);
  assertDeclaration('.section-heading > .eyebrow', 'grid-column', 'auto', editorial);
});

test('defines the tablet and mobile layout contracts', () => {
  const tablet = atRuleBody('@media (max-width: 900px)');
  const mobile = atRuleBody('@media (max-width: 600px)');

  for (const selector of [
    'h1',
    '.site-header nav',
    '.nav-toggle:not([hidden])',
    '.nav-toggle[hidden]',
    '.nav-links',
    '.nav-toggle:not([hidden]) + .nav-links',
    '.nav-toggle:not([hidden]) + .nav-links.is-open',
    '.system-row',
    '.project',
    '.project-visual',
    '.expertise-grid',
    '.hero-content',
  ]) ruleBody(selector, tablet);
  assertDeclaration('.nav-toggle[hidden]', 'display', 'none', tablet);
  assertDeclaration('.site-header nav', 'gap', '16px', tablet);
  assertDeclaration('.nav-links', 'display', 'flex');
  assertDeclaration('.nav-links', 'min-width', '0', tablet);
  assertDeclaration('.nav-links', 'overflow-x', 'auto', tablet);
  assert.equal(
    declarationValue(ruleBody('.nav-links', tablet), 'display'),
    undefined,
    'default no-JS navigation must remain visible at the tablet breakpoint',
  );
  assertDeclaration(
    '.nav-toggle:not([hidden]) + .nav-links',
    'display',
    'none',
    tablet,
  );
  assertDeclaration(
    '.nav-toggle:not([hidden]) + .nav-links.is-open',
    'display',
    'grid',
    tablet,
  );

  for (const selector of [
    ':root',
    'h1',
    'h2',
    '.section-heading',
    '.hero',
    '.hero-content',
    '.hero-summary',
    '.hero-actions',
    '.system-visual',
    '.system-map',
    '.achievement-orbit',
    '.achievement',
    '.section',
    '.system-row',
    '.project-copy',
    '.expertise-grid',
    '.resume-grid',
    '.capability-group',
    '.timeline',
    '.timeline > li',
    '.resume-block > p:not(.eyebrow)',
    '.site-footer .content-shell',
    'dialog',
    '.dialog-panel',
  ]) ruleBody(selector, mobile);
  assertDeclaration('.timeline', 'grid-template-columns', '1fr', mobile);
  assertDeclaration('.timeline > li', 'grid-template-columns', '1fr', mobile);
});

test('keeps the compact mobile hero within first-viewport framing', () => {
  const mobile = atRuleBody('@media (max-width: 600px)');
  const padding = declarationValue(ruleBody('.hero-content', mobile), 'padding');

  assert.equal(padding, '40px 0 8px');
  assert.doesNotMatch(padding, /\b180px\b/);
  assert.equal(
    exactRuleBodies('.content-shell', mobile).length,
    0,
    'mobile must retain the equivalent global content-shell width',
  );
});

test('keeps reveal content visible until enhancement is explicitly ready', () => {
  const defaultReveal = ruleBody('[data-reveal]');
  assert.equal(declarationValue(defaultReveal, 'opacity'), '1');
  assert.equal(declarationValue(defaultReveal, 'transform'), 'none');
  assertDeclaration('.reveal-ready [data-reveal]', 'opacity', '0');
  assertDeclaration(
    '.reveal-ready [data-reveal]',
    'transform',
    'translateY(16px)',
  );
  assertDeclaration('.reveal-ready [data-reveal].is-visible', 'opacity', '1');
  assertDeclaration(
    '.reveal-ready [data-reveal].is-visible',
    'transform',
    'none',
  );

  for (const { body, selectorParts } of styleRules()) {
    const opacity = declarationValue(body, 'opacity');
    const transform = declarationValue(body, 'transform');
    if (opacity !== '0' && transform !== 'translateY(16px)') continue;

    for (const selector of selectorParts.filter((part) => part.includes('[data-reveal]'))) {
      assert.match(
        selector,
        /^\.reveal-ready\s+\[data-reveal\]/,
        `hidden reveal state must require enhancement: ${selector}`,
      );
    }
  }
});

test('keeps motion opt-in and restores reveal visibility for reduced motion', () => {
  const noPreference = atRuleBody('@media (prefers-reduced-motion: no-preference)');
  const reduced = atRuleBody('@media (prefers-reduced-motion: reduce)');

  assertDeclaration('html', 'scroll-behavior', 'smooth', noPreference);
  assertDeclaration('[data-reveal]', 'opacity', '1', reduced);
  assertDeclaration('[data-reveal]', 'transform', 'none', reduced);
  assertDeclaration('.reveal-ready [data-reveal]', 'opacity', '1', reduced);
  assertDeclaration('.reveal-ready [data-reveal]', 'transform', 'none', reduced);
  assert.match(reduced, /scroll-behavior\s*:\s*auto\s*!important/);

  const outsideNoPreference = css.replace(noPreference, '');
  assert.doesNotMatch(outsideNoPreference, /scroll-behavior\s*:\s*smooth/);
});

test('keeps the hidden navigation toggle hidden before enhancement', () => {
  assertDeclaration('.nav-toggle', 'display', 'none');
  assertDeclaration('.nav-toggle[hidden]', 'display', 'none');
  assertDeclaration(
    '.nav-toggle:not([hidden])',
    'display',
    'block',
    atRuleBody('@media (max-width: 900px)'),
  );
});

test('avoids prohibited decorative treatments and viewport-scaled type', () => {
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
  assert.match('.BOKEH-contract-probe {}', prohibitedDecorativePattern);
  assert.doesNotMatch(css, prohibitedDecorativePattern);
  assert.doesNotMatch(css, /font-size\s*:[^;{}]*\d(?:\.\d+)?vw\b/i);
});

test('gives the hero a restrained identity-led typography hierarchy', () => {
  const mobile = atRuleBody('@media (max-width: 600px)');

  assertDeclaration('h1', 'max-width', '760px');
  assertDeclaration('h1', 'font-size', '3.75rem');
  assertDeclaration('h1', 'line-height', '1.02');
  assertDeclaration('.hero-name', 'font-size', '1.5rem');
  assertDeclaration('.hero-copy > .eyebrow', 'font-size', '0.875rem');
  assertDeclaration('h1', 'font-size', '2.5rem', mobile);
  assertDeclaration('.hero-name', 'font-size', '1.25rem', mobile);
  assertDeclaration('.hero-copy > .eyebrow', 'font-size', '0.75rem', mobile);
});

test('keeps hero content in the approved natural document flow', () => {
  assertDeclaration('.system-map', 'position', 'relative');
  assert.doesNotMatch(ruleBody('.system-map'), /(?:top|right|bottom|left)\s*:/);
});

test('limits border radii to the approved editorial values', () => {
  const allowedRadii = new Set(['var(--radius)', '4px', '6px', '0']);
  const literalRadii = literalBorderRadii(css);

  assertDeclaration(':root', '--radius', '6px');
  assert.ok(literalRadii.length > 0, 'expected border-radius declarations');
  assert.deepEqual(
    literalBorderRadii('.probe { outline-offset: 999px; width: 50vw; }'),
    [],
    'unrelated numeric declarations must not be treated as border radii',
  );
  const prohibitedRadii = literalBorderRadii(`
    .above-limit { border-radius: 7px }
    .percentage { border-radius: 25%; }
    .pill { border-radius: 999px; }
    .viewport-width { border-radius: 1vw; }
    .viewport-height { border-radius: 1vh; }
    .viewport-min { border-radius: 1vmin; }
    .viewport-max { border-radius: 1vmax }
  `);
  assert.deepEqual(
    prohibitedRadii,
    ['7px', '25%', '999px', '1vw', '1vh', '1vmin', '1vmax'],
  );
  for (const value of prohibitedRadii) {
    assert.equal(allowedRadii.has(value), false, `${value} must remain prohibited`);
  }
  for (const value of literalRadii) {
    assert.ok(
      allowedRadii.has(value),
      `border-radius ${value} exceeds the approved 0-6px editorial range`,
    );
  }
});
