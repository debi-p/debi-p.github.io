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

  listenerCount(type) {
    return (this.listeners.get(type) ?? []).length;
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

  contains(target) {
    return target === this;
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return this.queries.get(selector) ?? null;
  }

  querySelectorAll(selector) {
    if (this.env.options.throwQueryAll === selector) {
      throw new Error(`queryAll failed for ${selector}`);
    }
    return this.queryLists.get(selector) ?? [];
  }

  replaceChildren(...children) {
    this.children = children;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
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
    mediaQuery.removeListener = (listener) => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  } else {
    mediaQuery.addEventListener = (type, listener) => {
      env.events.push({ kind: 'media-listener', target: name, type });
      listeners.push(listener);
    };
    mediaQuery.removeEventListener = (type, listener) => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }
  mediaQuery.listenerCount = () => listeners.length;
  return mediaQuery;
}

function createHarness(options = {}) {
  const env = { events: [], observers: [], options };
  const document = new FakeDocument(env);
  env.document = document;

  const element = (name, elementOptions) => new FakeElement(name, env, elementOptions);
  const mount = element('project-list');
  mount.innerHTML = '<article data-project-fallback>Fallback Project</article>';
  const year = element('current-year');
  const header = element('site-header', { classes: ['site-header'] });
  const toggle = element('nav-toggle', { hidden: true });
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
  const navLinks = element('site-navigation', { classes: ['nav-links'] });
  const links = [
    element('nav-systems'),
    element('nav-experience'),
    element('nav-linkedin'),
    element('nav-contact'),
  ];
  for (const [link, href] of links.map((link, index) => [link, [
    '#systems',
    '#experience',
    'https://www.linkedin.com/in/debiprasadpradhan',
    'mailto:dpp2017@gmail.com',
  ][index]])) link.setAttribute('href', href);
  navLinks.queryLists.set('a', links);
  const sections = [element('systems'), element('experience')];

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
    ['#systems', sections[0]],
    ['#experience', sections[1]],
    ...Object.entries(fields),
  ]) document.queries.set(selector, value);
  document.queryLists.set('[data-case-study]', triggers);
  document.queryLists.set('[data-reveal]', reveals);
  document.queryLists.set('#site-navigation a[href^="#"]', links.slice(0, 2));

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
    closeButton,
    dialog,
    fields,
    header,
    links,
    mount,
    navLinks,
    reveals,
    root,
    toggle,
    triggers,
    sections,
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
      if (mode === 'second-observe-failure' && this.observed.length === 1) {
        throw new Error('observer setup failed after one target');
      }
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
  setRuntimeGlobal('fetch', async () => {
    if (options.fetchReject) throw new Error('network unavailable');
    return {
      ok: options.responseOk !== false,
      status: options.responseOk === false ? 503 : 200,
      json: async () => {
        if (options.jsonReject) throw new Error('invalid json');
        return options.payload ?? ({
      projects: [{
        title: 'Runtime Project',
        summary: 'Loaded from the portfolio project catalog.',
        sourceUrl: 'https://github.com/debi-p/runtime-project',
        liveUrl: 'https://debi-p.github.io/runtime-project/',
        coverImage: 'assets/1/assets/profile.png',
        order: 1,
        status: 'active',
      }],
        });
      },
    };
  });
  setRuntimeGlobal('HTMLDialogElement', FakeDialog);
  const Observer = installObserver(env, options.observer);
  env.window.IntersectionObserver = Observer;
  setRuntimeGlobal('IntersectionObserver', Observer);
  process.on('unhandledRejection', captureUnhandled);

  try {
    const url = new URL(mainUrl);
    url.searchParams.set('runtime-case', String(++importSequence));
    const module = await import(url.href);
    await flushAsyncWork();
    await assertion(env, module);
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

test('keeps the in-DOM project fallback for fetch, HTTP, JSON, and payload failures', async () => {
  for (const options of [
    { fetchReject: true },
    { responseOk: false },
    { jsonReject: true },
    { payload: { projects: null } },
  ]) {
    await withRuntime({ ...options, observer: 'none' }, (env) => {
      assert.match(env.mount.innerHTML, /Fallback Project/);
      assert.equal(env.year.textContent, String(new Date().getFullYear()));
      assert.equal(env.toggle.hidden, false);
    });
  }
});

test('marks only the intersecting internal section link as current', async () => {
  await withRuntime({ observer: 'success' }, (env) => {
    const observer = env.observers.find((candidate) => {
      return candidate.observed.some((target) => env.sections.includes(target));
    });
    assert.ok(observer, 'active navigation observer must observe internal sections');
    assert.deepEqual(observer.observed, env.sections);

    observer.callback([{
      intersectionRatio: 0.8,
      isIntersecting: true,
      target: env.sections[1],
    }]);
    assert.equal(env.links[1].getAttribute('aria-current'), 'location');
    assert.equal(env.links[1].classList.contains('is-active'), true);
    for (const link of [env.links[0], env.links[2], env.links[3]]) {
      assert.equal(link.getAttribute('aria-current'), null);
      assert.equal(link.classList.contains('is-active'), false);
    }

    env.window.emit('pagehide');
    assert.equal(observer.disconnected, true, 'navigation observer must be cleaned up');
  });
});

test('observer failure leaves navigation usable and does not block siblings', async () => {
  for (const observer of ['none', 'construction-failure', 'observe-failure']) {
    await withRuntime({ observer }, (env) => {
      assert.equal(env.toggle.hidden, observer !== 'none');
      assert.match(env.mount.innerHTML, /Runtime Project/);
      assert.equal(env.year.textContent, String(new Date().getFullYear()));
      assert.ok(env.links.every((link) => link.getAttribute('aria-current') === null));
    });
  }
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
  for (const observer of [
    'none',
    'construction-failure',
    'observe-failure',
    'second-observe-failure',
  ]) {
    await withRuntime({ observer }, (env) => {
      assert.ok(env.reveals.every((element) => element.classList.contains('is-visible')));
      assert.equal(env.root.classList.contains('reveal-ready'), false);
      if (observer.includes('observe-failure')) {
        assert.ok(env.observers.every((candidate) => candidate.disconnected));
      }
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

    const observer = env.observers.find((candidate) => {
      return candidate.observed.some((target) => env.reveals.includes(target));
    });
    assert.ok(observer, 'reveal observer must observe reveal targets');
    const target = env.reveals[0];
    observer.callback([{ isIntersecting: true, target }]);
    assert.equal(target.classList.contains('is-visible'), true);
    assert.deepEqual(observer.unobserved, [target]);
  });
});

test('rolls back every earlier navigation resource after a mid-setup failure', async () => {
  await withRuntime({
    failListener: { target: 'document', type: 'keydown' },
    observer: 'none',
  }, (env) => {
    assert.equal(env.toggle.listenerCount('click'), 0);
    assert.ok(env.links.every((link) => link.listenerCount('click') === 0));
    assert.equal(env.document.listenerCount('keydown'), 0);
    assert.equal(env.document.listenerCount('click'), 0);
    assert.equal(env.window.listenerCount('scroll'), 0);
    assert.equal(
      env.window.listenerCount('pagehide'),
      1,
      'only the independently successful case-study cleanup remains',
    );
    assert.equal(env.toggle.hidden, true);
  });
});

test('navigation setup is idempotent and pagehide removes every resource', async () => {
  await withRuntime({ observer: 'success' }, (env, module) => {
    const counts = () => ({
      documentClick: env.document.listenerCount('click'),
      escape: env.document.listenerCount('keydown'),
      linkClicks: env.links.map((link) => link.listenerCount('click')),
      media: env.desktopMedia.listenerCount(),
      pagehide: env.window.listenerCount('pagehide'),
      scroll: env.window.listenerCount('scroll'),
      toggle: env.toggle.listenerCount('click'),
    });
    const initial = counts();
    module.initNavigation();
    assert.deepEqual(counts(), initial, 'repeated setup must not duplicate resources');

    env.window.emit('pagehide');
    assert.deepEqual(counts(), {
      documentClick: 0,
      escape: 0,
      linkClicks: [0, 0, 0, 0],
      media: 0,
      pagehide: 0,
      scroll: 0,
      toggle: 0,
    });
    assert.ok(env.observers.every((observer) => observer.disconnected));
  });
});

test('case studies roll back partial setup and remain idempotent until pagehide', async () => {
  await withRuntime({
    failListener: { target: 'dialog-close', type: 'click' },
    observer: 'none',
  }, (env) => {
    assert.ok(env.triggers.every((trigger) => trigger.listenerCount('click') === 0));
    assert.equal(env.closeButton.listenerCount('click'), 0);
    assert.ok(env.triggers.every((trigger) => trigger.hidden));
  });

  await withRuntime({ observer: 'none' }, (env, module) => {
    const initialTriggerCounts = env.triggers.map((trigger) => trigger.listenerCount('click'));
    module.initCaseStudies();
    assert.deepEqual(
      env.triggers.map((trigger) => trigger.listenerCount('click')),
      initialTriggerCounts,
    );
    assert.equal(env.dialog.listenerCount('cancel'), 1);
    env.window.emit('pagehide');
    assert.ok(env.triggers.every((trigger) => trigger.listenerCount('click') === 0));
    assert.equal(env.closeButton.listenerCount('click'), 0);
    assert.equal(env.dialog.listenerCount('cancel'), 0);
    assert.equal(env.dialog.listenerCount('close'), 0);
  });
});

test('reveal setup is idempotent and disconnects on pagehide', async () => {
  await withRuntime({ observer: 'success' }, (env, module) => {
    const revealObserver = env.observers.find((candidate) => {
      return candidate.observed.some((target) => env.reveals.includes(target));
    });
    assert.ok(revealObserver);
    const observerCount = env.observers.length;
    const pagehideCount = env.window.listenerCount('pagehide');
    module.initReveal();
    assert.equal(env.observers.length, observerCount);
    assert.equal(env.window.listenerCount('pagehide'), pagehideCount);
    env.window.emit('pagehide');
    assert.equal(revealObserver.disconnected, true);
    assert.equal(env.window.listenerCount('pagehide'), 0);
  });
});
