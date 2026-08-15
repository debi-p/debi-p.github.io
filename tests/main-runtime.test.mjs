import assert from 'node:assert/strict';
import test from 'node:test';

import { caseStudies } from '../assets/js/content.js';

const mainUrl = new URL('../assets/js/main.js', import.meta.url);
const globalKeys = ['document', 'window', 'fetch', 'HTMLDialogElement', 'IntersectionObserver'];
let importSequence = 0;

class FakeClassList {
  constructor(owner, initial = []) {
    this.owner = owner;
    this.values = new Set(initial);
  }

  add(...tokens) {
    for (const token of tokens) {
      this.values.add(token);
      this.owner.env.events.push({ kind: 'class:add', target: this.owner.name, token });
    }
  }

  remove(...tokens) {
    for (const token of tokens) this.values.delete(token);
  }

  toggle(token, force) {
    const enabled = force === undefined ? !this.values.has(token) : Boolean(force);
    if (enabled) this.values.add(token);
    else this.values.delete(token);
    return enabled;
  }

  contains(token) {
    return this.values.has(token);
  }
}

class FakeEventTarget {
  constructor(name, env) {
    this.name = name;
    this.env = env;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    this.env.events.push({ kind: 'listener', target: this.name, type });
    const failure = this.env.options.failListener;
    if (failure?.target === this.name && failure.type === type) {
      throw new Error(`listener setup failed for ${this.name}:${type}`);
    }
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    this.listeners.set(type, listeners.filter((candidate) => candidate !== listener));
  }

  emit(type, event = {}) {
    const payload = { target: this, type, ...event };
    for (const listener of this.listeners.get(type) ?? []) listener(payload);
  }
}

class FakeElement extends FakeEventTarget {
  constructor(name, env, { classes = [], dataset = {}, hidden = false } = {}) {
    super(name, env);
    this._hidden = hidden;
    this.attributes = new Map();
    this.children = [];
    this.classList = new FakeClassList(this, classes);
    this.dataset = { ...dataset };
    this.innerHTML = '';
    this.queries = new Map();
    this.queryLists = new Map();
    this.textContent = '';
  }

  get hidden() {
    return this._hidden;
  }

  set hidden(value) {
    this._hidden = Boolean(value);
    this.env.events.push({ kind: 'hidden', target: this.name, value: this._hidden });
  }

  focus() {
    this.env.document.activeElement = this;
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return this.queries.get(selector) ?? null;
  }

  querySelectorAll(selector) {
    return this.queryLists.get(selector) ?? [];
  }

  replaceChildren(...children) {
    this.children = children;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

class FakeDialog extends FakeElement {}

class FakeDocument extends FakeEventTarget {
  constructor(env) {
    super('document', env);
    this.activeElement = null;
    this.queries = new Map();
    this.queryLists = new Map();
  }

  createElement(tagName) {
    return new FakeElement(tagName, this.env);
  }

  querySelector(selector) {
    if (this.env.options.throwQuery === selector) {
      throw new Error(`query failed for ${selector}`);
    }
    return this.queries.get(selector) ?? null;
  }

  querySelectorAll(selector) {
    return this.queryLists.get(selector) ?? [];
  }
}

function createMediaQuery(env, name, matches, legacy) {
  const listeners = [];
  const mediaQuery = {
    matches,
    emit(nextMatches) {
      this.matches = nextMatches;
      for (const listener of listeners) listener({ matches: nextMatches });
    },
  };

  if (legacy) {
    mediaQuery.addListener = (listener) => {
      env.events.push({ kind: 'media-listener', target: name, type: 'legacy' });
      listeners.push(listener);
    };
  } else {
    mediaQuery.addEventListener = (type, listener) => {
      env.events.push({ kind: 'media-listener', target: name, type });
      listeners.push(listener);
    };
  }
  return mediaQuery;
}

function createHarness(options = {}) {
  const env = { events: [], observers: [], options };
  const document = new FakeDocument(env);
  env.document = document;

  const element = (name, elementOptions) => new FakeElement(name, env, elementOptions);
  const mount = element('project-list');
  const year = element('current-year');
  const header = element('site-header', { classes: ['site-header'] });
  const toggle = element('nav-toggle', { hidden: true });
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
  const navLinks = element('site-navigation', { classes: ['nav-links'] });
  const links = [element('nav-link-1'), element('nav-link-2')];
  navLinks.queryLists.set('a', links);

  const triggers = caseStudies.map(({ id }) => {
    return element(`trigger-${id}`, { dataset: { caseStudy: id }, hidden: true });
  });
  const dialog = new FakeDialog('case-study-dialog', env);
  const closeButton = element('dialog-close');
  if (!options.missingCloseButton) dialog.queries.set('.dialog-close', closeButton);
  dialog.open = false;
  dialog.showModalCalls = 0;
  if (options.dialogSupported !== false) {
    dialog.showModal = () => {
      dialog.open = true;
      dialog.showModalCalls += 1;
    };
  }
  dialog.close = () => {
    dialog.open = false;
    dialog.emit('close');
  };

  const textSelectors = [
    '#case-study-category',
    '#case-study-title',
    '#case-study-metric',
    '#case-study-problem',
    '#case-study-role',
  ];
  const listSelectors = [
    '#case-study-approach',
    '#case-study-outcomes',
    '#case-study-technologies',
  ];
  const fields = Object.fromEntries(
    [...textSelectors, ...listSelectors].map((selector) => [selector, element(selector)]),
  );
  const canvas = element('system-map');
  const hero = element('hero');
  const mapContext = {
    arc: (...args) => env.events.push({ kind: 'canvas', method: 'arc', args }),
    beginPath: (...args) => env.events.push({ kind: 'canvas', method: 'beginPath', args }),
    clearRect: (...args) => env.events.push({ kind: 'canvas', method: 'clearRect', args }),
    fill: (...args) => env.events.push({ kind: 'canvas', method: 'fill', args }),
    fillText: (...args) => env.events.push({ kind: 'canvas', method: 'fillText', args }),
    lineTo: (...args) => env.events.push({ kind: 'canvas', method: 'lineTo', args }),
    measureText: (text) => ({ width: text.length * 6.5 }),
    moveTo: (...args) => env.events.push({ kind: 'canvas', method: 'moveTo', args }),
    setTransform: (...args) => env.events.push({ kind: 'canvas', method: 'setTransform', args }),
    stroke: (...args) => env.events.push({ kind: 'canvas', method: 'stroke', args }),
  };
  canvas.closest = () => hero;
  canvas.getBoundingClientRect = () => ({ height: 225, left: 0, top: 0, width: 400 });
  canvas.getContext = (type) => type === '2d' ? mapContext : null;
  canvas.height = 0;
  canvas.width = 0;
  hero.getBoundingClientRect = () => ({ height: 500, left: 0, top: 0, width: 800 });
  const reveals = [element('reveal-1'), element('reveal-2')];
  const root = element('document-element');
  document.documentElement = root;

  for (const [selector, value] of [
    ['#project-list', mount],
    ['[data-current-year]', year],
    ['.site-header', header],
    ['.nav-toggle', toggle],
    ['#site-navigation', navLinks],
    ['#case-study-dialog', dialog],
    ['#system-map', canvas],
    ...Object.entries(fields),
  ]) document.queries.set(selector, value);
  document.queryLists.set('[data-case-study]', triggers);
  document.queryLists.set('[data-reveal]', reveals);

  const window = new FakeEventTarget('window', env);
  window.scrollY = 0;
  if (options.matchMedia !== false) {
    env.desktopMedia = createMediaQuery(env, 'desktop', false, options.legacyMedia);
    env.reducedMedia = createMediaQuery(
      env,
      'reduced-motion',
      Boolean(options.reducedMotion),
      options.legacyMedia,
    );
    window.matchMedia = (query) => {
      return query.includes('prefers-reduced-motion')
        ? env.reducedMedia
        : env.desktopMedia;
    };
  }

  Object.assign(env, {
    canvas,
    closeButton,
    dialog,
    fields,
    header,
    hero,
    links,
    mount,
    mapContext,
    navLinks,
    reveals,
    root,
    toggle,
    triggers,
    window,
    year,
  });
  return env;
}

function installObserver(env, mode) {
  if (!mode || mode === 'none') return undefined;

  return class FakeIntersectionObserver {
    constructor(callback) {
      env.events.push({ kind: 'observer:create' });
      if (mode === 'construction-failure') throw new Error('observer construction failed');
      this.callback = callback;
      this.disconnected = false;
      this.observed = [];
      this.unobserved = [];
      env.observers.push(this);
    }

    disconnect() {
      this.disconnected = true;
    }

    observe(target) {
      env.events.push({ kind: 'observer:observe', target: target.name });
      if (mode === 'observe-failure') throw new Error('observer setup failed');
      this.observed.push(target);
    }

    unobserve(target) {
      this.unobserved.push(target);
    }
  };
}

function setRuntimeGlobal(name, value) {
  if (value === undefined) {
    Reflect.deleteProperty(globalThis, name);
    return;
  }
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
    writable: true,
  });
}

async function flushAsyncWork() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setTimeout(resolve, 10));
}

async function withRuntime(options, assertion) {
  const descriptors = new Map(
    globalKeys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  const env = createHarness(options);
  const unhandledRejections = [];
  const captureUnhandled = (reason) => unhandledRejections.push(reason);

  setRuntimeGlobal('document', env.document);
  setRuntimeGlobal('window', env.window);
  setRuntimeGlobal('fetch', async () => ({
    ok: true,
    json: async () => ({
      projects: [{
        title: 'Runtime Project',
        summary: 'Loaded from the portfolio project catalog.',
        sourceUrl: 'https://github.com/debi-p/runtime-project',
        liveUrl: 'https://debi-p.github.io/runtime-project/',
        coverImage: 'assets/1/assets/profile.png',
        order: 1,
        status: 'active',
      }],
    }),
  }));
  setRuntimeGlobal('HTMLDialogElement', FakeDialog);
  setRuntimeGlobal('IntersectionObserver', installObserver(env, options.observer));
  process.on('unhandledRejection', captureUnhandled);

  try {
    const url = new URL(mainUrl);
    url.searchParams.set('runtime-case', String(++importSequence));
    await import(url.href);
    await flushAsyncWork();
    await assertion(env);
    await flushAsyncWork();
    assert.deepEqual(unhandledRejections, [], 'runtime must not leak unhandled rejections');
  } finally {
    process.off('unhandledRejection', captureUnhandled);
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test('isolates a synchronous initializer failure from project, year, and navigation siblings', async () => {
  await withRuntime({ observer: 'none', throwQuery: '#case-study-dialog' }, (env) => {
    assert.match(env.mount.innerHTML, /Runtime Project/);
    assert.equal(env.year.textContent, String(new Date().getFullYear()));
    assert.equal(env.toggle.hidden, false);
  });
});

test('contains a system-map lookup exception without an unhandled rejection', async () => {
  await withRuntime({ observer: 'none', throwQuery: '#system-map' }, (env) => {
    assert.match(env.mount.innerHTML, /Runtime Project/);
    assert.equal(env.year.textContent, String(new Date().getFullYear()));
  });
});

test('loads the system-map enhancement without disturbing sibling initializers', async () => {
  await withRuntime({ observer: 'none' }, (env) => {
    assert.match(env.mount.innerHTML, /Runtime Project/);
    assert.equal(env.year.textContent, String(new Date().getFullYear()));
    assert.equal(env.canvas.width, 400);
    assert.equal(env.canvas.height, 225);
    assert.ok(env.events.some((event) => event.kind === 'canvas' && event.method === 'clearRect'));
    const particleDraws = env.events.filter(
      (event) => event.kind === 'canvas' && event.method === 'arc',
    ).length;
    assert.ok(particleDraws >= 100 && particleDraws <= 300);
  });
});

test('keeps case-study triggers hidden when dialog support or setup is unavailable', async () => {
  await withRuntime({ dialogSupported: false, observer: 'none' }, (env) => {
    assert.ok(env.triggers.every((trigger) => trigger.hidden));
  });
  await withRuntime({ missingCloseButton: true, observer: 'none' }, (env) => {
    assert.ok(env.triggers.every((trigger) => trigger.hidden));
  });
  await withRuntime({
    failListener: { target: 'dialog-close', type: 'click' },
    observer: 'none',
  }, (env) => {
    assert.ok(env.triggers.every((trigger) => trigger.hidden));
  });
});

test('enables a supported case-study dialog only after setup and renders known records safely', async () => {
  await withRuntime({ observer: 'none' }, (env) => {
    assert.ok(env.triggers.every((trigger) => !trigger.hidden));
    const firstEnablement = env.events.findIndex(
      (event) => event.kind === 'hidden' && event.target.startsWith('trigger-') && !event.value,
    );
    const installedBeforeEnablement = env.events.slice(0, firstEnablement)
      .filter((event) => event.kind === 'listener')
      .map((event) => `${event.target}:${event.type}`);
    for (const trigger of env.triggers) {
      assert.ok(installedBeforeEnablement.includes(`${trigger.name}:click`));
    }
    assert.ok(installedBeforeEnablement.includes('dialog-close:click'));
    assert.ok(installedBeforeEnablement.includes('case-study-dialog:click'));
    assert.ok(installedBeforeEnablement.includes('case-study-dialog:close'));

    const expected = caseStudies[0];
    const trigger = env.triggers[0];
    trigger.emit('click');
    assert.equal(env.dialog.showModalCalls, 1);
    assert.equal(env.dialog.open, true);
    for (const [selector, property] of [
      ['#case-study-category', 'category'],
      ['#case-study-title', 'name'],
      ['#case-study-metric', 'metric'],
      ['#case-study-problem', 'problem'],
      ['#case-study-role', 'role'],
    ]) {
      assert.equal(env.fields[selector].textContent, expected[property]);
      assert.equal(env.fields[selector].innerHTML, '');
    }
    for (const [selector, property] of [
      ['#case-study-approach', 'approach'],
      ['#case-study-outcomes', 'outcomes'],
      ['#case-study-technologies', 'technologies'],
    ]) {
      assert.deepEqual(
        env.fields[selector].children.map((item) => item.textContent),
        expected[property],
      );
    }

    env.closeButton.emit('click');
    assert.equal(env.dialog.open, false);
    assert.equal(env.document.activeElement, trigger);
    env.triggers[1].dataset.caseStudy = 'unknown-system';
    env.triggers[1].emit('click');
    assert.equal(env.dialog.showModalCalls, 1, 'unknown ids must not open the dialog');
  });
});

test('keeps navigation hidden when listener setup fails', async () => {
  await withRuntime({
    failListener: { target: 'nav-toggle', type: 'click' },
    observer: 'none',
  }, (env) => {
    assert.equal(env.toggle.hidden, true);
    assert.match(env.mount.innerHTML, /Runtime Project/);
    assert.equal(env.year.textContent, String(new Date().getFullYear()));
  });
});

test('supports missing and legacy matchMedia while preserving navigation behavior', async () => {
  await withRuntime({ matchMedia: false, observer: 'none' }, (env) => {
    assert.equal(env.toggle.hidden, false);
    assert.ok(env.reveals.every((element) => element.classList.contains('is-visible')));
  });

  await withRuntime({ legacyMedia: true, observer: 'none' }, (env) => {
    assert.ok(
      env.events.some(
        (event) => event.kind === 'media-listener' && event.type === 'legacy',
      ),
    );
    assert.equal(env.toggle.hidden, false);
    env.toggle.emit('click');
    assert.equal(env.toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(env.toggle.getAttribute('aria-label'), 'Close navigation');
    assert.ok(env.navLinks.classList.contains('is-open'));
    env.links[0].emit('click');
    assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');

    env.toggle.emit('click');
    env.document.emit('keydown', { key: 'Escape' });
    assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(env.document.activeElement, env.toggle);

    env.toggle.emit('click');
    env.desktopMedia.emit(true);
    assert.equal(env.toggle.getAttribute('aria-expanded'), 'false');
  });
});

test('keeps reveal content visible when observers are missing or fail', async () => {
  for (const observer of ['none', 'construction-failure', 'observe-failure']) {
    await withRuntime({ observer }, (env) => {
      assert.ok(env.reveals.every((element) => element.classList.contains('is-visible')));
      assert.equal(env.root.classList.contains('reveal-ready'), false);
      if (observer === 'observe-failure') assert.equal(env.observers[0].disconnected, true);
    });
  }
});

test('enables reveal transitions only after observation succeeds', async () => {
  await withRuntime({ observer: 'success' }, (env) => {
    assert.equal(env.root.classList.contains('reveal-ready'), true);
    const readyIndex = env.events.findIndex(
      (event) => event.kind === 'class:add' && event.token === 'reveal-ready',
    );
    const observeIndices = env.events
      .map((event, index) => [event, index])
      .filter(([event]) => event.kind === 'observer:observe' && event.target.startsWith('reveal-'))
      .map(([, index]) => index);
    assert.ok(observeIndices.every((index) => index < readyIndex));

    const observer = env.observers[0];
    const target = env.reveals[0];
    observer.callback([{ isIntersecting: true, target }]);
    assert.equal(target.classList.contains('is-visible'), true);
    assert.deepEqual(observer.unobserved, [target]);
  });
});
