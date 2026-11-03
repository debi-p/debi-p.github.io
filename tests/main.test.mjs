import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../assets/js/main.js', import.meta.url), 'utf8');

test('removes obsolete system-map and impact-metric enhancements', () => {
  assert.doesNotMatch(source, /system-map\.js|impact-metrics\.js/);
  assert.doesNotMatch(source, /initSystemMap|initImpactMetrics|initMetrics/);
  assert.doesNotMatch(source, /#system-map|data-metric-value/);
});

test('keeps only the reference page progressive enhancements', () => {
  const approved = [
    'hydrateProjects',
    'initNavigation',
    'initReveal',
    'initCaseStudies',
    'initFooterYear',
  ];
  const registrations = [...source.matchAll(/^\s*runSafely\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*;/gm)]
    .map((match) => match[1]);

  assert.deepEqual(registrations, approved, 'only approved enhancements may be registered');
  for (const initializer of approved) {
    assert.match(source, new RegExp(`function\\s+${initializer}\\b`));
  }
});

test('hydrates ordered projects through the dedicated renderer', () => {
  assert.match(source, /import\s*\{[^}]*renderProjects[^}]*\}\s*from\s*['"]\.\/render-projects\.js['"]/s);
  assert.match(source, /querySelector\s*\(\s*['"]#project-list['"]\s*\)/);
  assert.match(source, /fetch\s*\(\s*['"]public\.json['"]\s*\)/);
});

test('tracks active sections inside navigation initialization', () => {
  assert.doesNotMatch(source, /function\s+initActiveNavigation\b/);
  const navigation = source.match(/function\s+initNavigation\b[\s\S]*?\n}\n\nexport function\s+initCaseStudies\b/)?.[0] ?? '';
  assert.match(navigation, /IntersectionObserver/);
  assert.match(navigation, /aria-current/);
  assert.match(navigation, /observer\.disconnect\(\)/);
  assert.match(navigation, /classList\.add\(\s*['"]nav-ready['"]\s*\)/);
  assert.match(navigation, /classList\.remove\(\s*['"]nav-ready['"]\s*\)/);
});

test('keeps dialog rendering text-safe', () => {
  assert.match(source, /\.textContent\s*=/);
  assert.match(source, /document\.createElement\s*\(\s*['"]li['"]\s*\)/);
  assert.match(source, /\.replaceChildren\s*\(/);
});
