import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const mainUrl = new URL('../assets/js/main.js', import.meta.url);
const mainExists = existsSync(mainUrl);
const source = mainExists ? readFileSync(mainUrl, 'utf8') : '';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function functionSource(name) {
  const signature = new RegExp(
    `(?:async\\s+)?function\\s+${escapeRegExp(name)}\\s*\\([^)]*\\)\\s*\\{`,
  ).exec(source);
  assert.ok(signature, `expected function ${name}`);

  const openingBrace = source.indexOf('{', signature.index);
  let depth = 1;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openingBrace + 1; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;
    if (depth === 0) return source.slice(signature.index, index + 1);
  }

  assert.fail(`expected closing brace for ${name}`);
}

function occurrenceCount(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

test('provides the progressive enhancement entry point', () => {
  assert.ok(mainExists, 'assets/js/main.js must exist');
});

test('declares project hydration before unrelated enhancements', () => {
  assert.match(
    source,
    /import\s*\{[^}]*\bcaseStudies\b[^}]*\}\s*from\s*['"]\.\/content\.js['"]/s,
  );
  assert.match(
    source,
    /import\s*\{[^}]*\brenderProjects\b[^}]*\}\s*from\s*['"]\.\/render-projects\.js['"]/s,
  );

  const projects = functionSource('initProjects');
  assert.match(projects, /querySelector\s*\(\s*['"]#project-list['"]\s*\)/);
  assert.match(projects, /fetch\s*\(\s*['"]public\.json['"]\s*\)/);
  assert.match(projects, /\.innerHTML\s*=\s*renderProjects\s*\(\s*payload\.projects\s*\)/);
  assert.equal(
    occurrenceCount(source, /\.innerHTML\s*=/g),
    1,
    'renderProjects hydration must be the only innerHTML assignment',
  );

  const projectsCall = source.indexOf('runSafely(initProjects)');
  assert.notEqual(projectsCall, -1, 'initProjects must use the isolation boundary');
  for (const initializer of [
    'initFooterYear',
    'initNavigation',
    'initCaseStudyDialog',
    'initReveals',
  ]) {
    const call = source.indexOf(`runSafely(${initializer})`);
    assert.notEqual(call, -1, `${initializer} must use its own isolation boundary`);
    assert.ok(projectsCall < call, `initProjects must run before ${initializer}`);
  }
});

test('orders navigation enablement after listener installation', () => {
  const navigation = functionSource('initNavigation');
  const enablement = navigation.indexOf('toggle.hidden = false');

  assert.notEqual(enablement, -1, 'navigation must reveal its toggle after setup');
  assert.ok(
    navigation.lastIndexOf('addEventListener') < enablement,
    'all navigation listeners must be installed before toggle enablement',
  );
  assert.match(navigation, /setAttribute\s*\(\s*['"]aria-expanded['"]/);
  assert.match(navigation, /setAttribute\s*\(\s*['"]aria-label['"]/);
  assert.match(navigation, /classList\.(?:toggle|add|remove)\s*\(\s*['"]is-open['"]/);
  assert.match(
    navigation,
    /querySelectorAll\s*\([^)]*\)[\s\S]*?addEventListener\s*\(\s*['"]click['"]\s*,\s*close/,
    'every navigation link must close the mobile menu',
  );
  assert.match(navigation, /['"]Escape['"]/);
  assert.match(navigation, /toggle\.focus\s*\(/);
  assert.match(navigation, /scrollY\s*>\s*20/);
  assert.match(navigation, /addEventListener\s*\(\s*['"]scroll['"][\s\S]*?passive\s*:\s*true/);
  assert.match(navigation, /matchMedia\s*\(/);
  assert.match(navigation, /addEventListener\s*\(\s*['"]change['"]/);
  assert.match(navigation, /typeof\s+window\.matchMedia\s*===\s*['"]function['"]/);
  assert.match(navigation, /\.addListener\s*\(/, 'legacy MediaQueryList must be supported');

  const afterEnablement = navigation
    .slice(enablement + 'toggle.hidden = false'.length)
    .replace(/[;\s}]/g, '');
  assert.equal(afterEnablement, '', 'toggle enablement must be the final setup step');
});

test('orders reveal-ready after observer setup and keeps inline styles untouched', () => {
  const reveals = functionSource('initReveals');
  const observerCreation = reveals.indexOf('new IntersectionObserver');
  const observeSetup = reveals.indexOf('.observe(');
  const revealReady = reveals.indexOf("classList.add('reveal-ready')");

  assert.match(reveals, /prefers-reduced-motion:\s*reduce/);
  assert.match(reveals, /typeof\s+IntersectionObserver\s*===\s*['"]undefined['"]/);
  assert.match(reveals, /classList\.add\s*\(\s*['"]is-visible['"]\s*\)/);
  assert.equal(
    occurrenceCount(reveals, /classList\.add\s*\(\s*['"]reveal-ready['"]\s*\)/g),
    1,
    'reveal-ready must have one guarded enablement point',
  );
  assert.ok(observerCreation !== -1 && observerCreation < observeSetup);
  assert.ok(observeSetup < revealReady, 'reveal-ready must follow successful observe setup');
  assert.match(reveals, /isIntersecting/);
  assert.match(reveals, /\.unobserve\s*\(/);
  assert.match(reveals, /\.disconnect\s*\(/);
  assert.doesNotMatch(source, /\.style\.opacity\s*=/);
  assert.doesNotMatch(source, /style\s*=\s*[^;\n]*opacity/i);
});

test('declares safe dialog rendering and fail-closed trigger enablement', () => {
  const setText = functionSource('setText');
  const renderList = functionSource('renderList');
  const dialog = functionSource('initCaseStudyDialog');

  assert.match(source, /new\s+Map\s*\(\s*caseStudies\.map\s*\(/);
  assert.match(setText, /document\.querySelector\s*\(/);
  assert.match(setText, /\.textContent\s*=/);
  assert.match(renderList, /document\.createElement\s*\(\s*['"]li['"]\s*\)/);
  assert.match(renderList, /\.textContent\s*=/);
  assert.match(renderList, /\.replaceChildren\s*\(/);
  assert.match(dialog, /HTMLDialogElement/);
  assert.match(dialog, /showModal\s*\(/);
  assert.match(dialog, /if\s*\(\s*!\s*record\s*\)\s*return/);
  for (const field of ['category', 'name', 'summary', 'metric', 'problem', 'role']) {
    assert.match(dialog, new RegExp(`record\\.${field}\\b`));
  }
  for (const field of ['approach', 'outcomes', 'technologies']) {
    assert.match(dialog, new RegExp(`renderList\\s*\\([^)]*record\\.${field}\\b`));
  }
  assert.match(dialog, /\.dialog-close/);
  assert.match(dialog, /\.close\s*\(/);
  assert.match(dialog, /event\.target\s*===\s*dialog/);
  assert.match(dialog, /addEventListener\s*\(\s*['"]close['"]/);
  assert.match(dialog, /\.focus\s*\(/);
  assert.doesNotMatch(dialog, /innerHTML/);
  const triggerEnablement = dialog.indexOf('trigger.hidden = false');
  assert.notEqual(triggerEnablement, -1, 'dialog triggers must be enabled after setup');
  assert.ok(
    dialog.lastIndexOf('addEventListener') < triggerEnablement,
    'all dialog listeners must be installed before trigger enablement',
  );
  assert.doesNotMatch(source, /https?:\/\/|mailto:/i);
});

test('declares footer hydration and synchronous/asynchronous isolation guards', () => {
  const footer = functionSource('initFooterYear');
  const runSafely = functionSource('runSafely');
  const map = functionSource('initSystemMapSafely');

  assert.match(footer, /\[data-current-year\]/);
  assert.match(footer, /new\s+Date\s*\(\s*\)\.getFullYear\s*\(\s*\)/);
  assert.match(footer, /\.textContent\s*=/);

  assert.match(runSafely, /try\s*\{/);
  assert.match(runSafely, /(?:const|let)\s+\w+\s*=\s*initializer\s*\(\s*\)/);
  assert.match(runSafely, /Promise\.resolve\s*\(/);
  assert.match(runSafely, /\.catch\s*\(/);
  assert.match(runSafely, /catch\s*\{/);

  assert.doesNotMatch(
    source,
    /^\s*import[\s\S]*?from\s*['"]\.\/system-map\.js['"]/m,
    'system-map must never be a top-level static import',
  );
  assert.match(map, /async\s+function\s+initSystemMapSafely/);
  assert.match(map, /querySelector\s*\(\s*['"]#system-map['"]\s*\)/);
  assert.match(map, /try\s*\{/);
  assert.ok(
    map.indexOf('try') < map.indexOf("querySelector('#system-map')"),
    'the system-map lookup must be inside the async initializer try block',
  );
  assert.match(map, /import\s*\(\s*['"]\.\/system-map\.js['"]\s*\)/);
  assert.match(map, /initSystemMap\s*\(\s*canvas\s*\)/);
  assert.match(map, /catch\s*\{/);
  assert.doesNotMatch(map, /console\./);
  assert.match(source, /runSafely\s*\(\s*initSystemMapSafely\s*\)\s*;/);
  assert.doesNotMatch(source, /void\s+initSystemMapSafely\s*\(/);
});
