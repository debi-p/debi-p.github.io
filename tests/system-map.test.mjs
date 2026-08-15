import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildSphereConnections,
  buildSphereParticles,
  initSystemMap,
  shouldAnimate,
} from '../assets/js/system-map.js';

const GLOBAL_KEYS = [
  'document',
  'window',
  'IntersectionObserver',
  'ResizeObserver',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'performance',
];

class FakeEventTarget {
  constructor(name, hooks = {}) {
    this.name = name;
    this.hooks = hooks;
    this.listeners = new Map();
    this.added = [];
    this.removed = [];
  }

  addEventListener(type, listener, options) {
    this.added.push({ type, listener, options });
    this.hooks.beforeAdd?.(type);
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    this.listeners.set(type, listeners.filter((candidate) => candidate !== listener));
    this.removed.push({ type, listener });
    this.hooks.afterRemove?.(type);
  }

  emit(type, event = {}) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener({ type, target: this, ...event });
    }
  }

  listenerCount(type) {
    return (this.listeners.get(type) ?? []).length;
  }
}

function createContext(hooks = {}) {
  const calls = [];
  const writes = [];
  const context = {
    calls,
    writes,
    arc(...args) {
      calls.push({ method: 'arc', args });
    },
    beginPath(...args) {
      calls.push({ method: 'beginPath', args });
    },
    clearRect(...args) {
      hooks.beforeDraw?.();
      calls.push({ method: 'clearRect', args });
    },
    fill(...args) {
      calls.push({ method: 'fill', args });
    },
    fillText(...args) {
      calls.push({ method: 'fillText', args });
    },
    lineTo(...args) {
      calls.push({ method: 'lineTo', args });
    },
    measureText(text) {
      return { width: text.length * 6.5 };
    },
    moveTo(...args) {
      calls.push({ method: 'moveTo', args });
    },
    setTransform(...args) {
      calls.push({ method: 'setTransform', args });
    },
    stroke(...args) {
      calls.push({ method: 'stroke', args });
    },
  };

  for (const property of ['fillStyle', 'font', 'lineWidth', 'strokeStyle']) {
    Object.defineProperty(context, property, {
      configurable: true,
      get() {
        return this[`_${property}`];
      },
      set(value) {
        this[`_${property}`] = value;
        writes.push({ property, value });
      },
    });
  }

  return context;
}

function createMediaQuery(mode, matches = false, hooks = {}) {
  const added = [];
  const listeners = [];
  const removed = [];
  const mediaQuery = {
    matches,
    added,
    listeners,
    removed,
    emit(nextMatches) {
      this.matches = nextMatches;
      for (const listener of [...listeners]) listener({ matches: nextMatches });
    },
  };

  if (mode === 'legacy') {
    mediaQuery.addListener = (listener) => {
      added.push(listener);
      hooks.beforeAdd?.('legacy');
      listeners.push(listener);
    };
    mediaQuery.removeListener = (listener) => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
      removed.push(listener);
      hooks.afterRemove?.('legacy');
    };
  } else {
    mediaQuery.addEventListener = (type, listener) => {
      assert.equal(type, 'change');
      added.push(listener);
      hooks.beforeAdd?.('modern');
      listeners.push(listener);
    };
    mediaQuery.removeEventListener = (type, listener) => {
      assert.equal(type, 'change');
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
      removed.push(listener);
      hooks.afterRemove?.('modern');
    };
  }

  return mediaQuery;
}

function setGlobal(name, value) {
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

function createHarness(options = {}) {
  const setupAttempts = [];
  const teardownAttempts = [];
  const attemptSetup = (stage) => {
    setupAttempts.push(stage);
    if (options.failAt === stage) throw new Error(`setup failed at ${stage}`);
  };
  const attemptTeardown = (stage) => {
    teardownAttempts.push(stage);
    if (options.failTeardownAt === stage) throw new Error(`teardown failed at ${stage}`);
  };
  const context = createContext({ beforeDraw: () => attemptSetup('canvas-draw') });
  const hero = new FakeEventTarget('hero', {
    beforeAdd: (type) => {
      if (type === 'pointermove') attemptSetup('hero-pointer-add');
    },
    afterRemove: (type) => {
      if (type === 'pointermove') attemptTeardown('hero-pointer-remove');
    },
  });
  const canvas = new FakeEventTarget('canvas');
  const window = new FakeEventTarget('window', {
    beforeAdd: (type) => {
      if (type === 'resize') attemptSetup('window-resize-add');
    },
    afterRemove: (type) => {
      if (type === 'resize') attemptTeardown('window-resize-remove');
    },
  });
  const document = new FakeEventTarget('document', {
    beforeAdd: (type) => {
      if (type === 'visibilitychange') attemptSetup('document-visibility-add');
    },
    afterRemove: (type) => {
      if (type === 'visibilitychange') attemptTeardown('document-visibility-remove');
    },
  });
  document.visibilityState = options.visibilityState ?? 'visible';
  const canvasRect = {
    height: 225,
    left: 10,
    top: 20,
    width: 400,
    ...options.canvasRect,
  };
  const heroRect = {
    height: 360,
    left: 0,
    top: 0,
    width: 800,
    ...options.heroRect,
  };

  canvas.width = 0;
  canvas.height = 0;
  canvas.getBoundingClientRect = () => {
    attemptSetup('canvas-resize');
    return { ...canvasRect };
  };
  canvas.closest = (selector) => selector === '.hero' ? hero : null;
  if (options.context === 'missing') canvas.getContext = undefined;
  else canvas.getContext = () => options.context === null ? null : context;
  hero.getBoundingClientRect = () => ({ ...heroRect });

  window.devicePixelRatio = options.devicePixelRatio ?? 1;
  const mediaQuery = createMediaQuery(
    options.mediaMode ?? 'modern',
    Boolean(options.reducedMotion),
    {
      beforeAdd: (mode) => attemptSetup(`motion-${mode}-add`),
      afterRemove: (mode) => attemptTeardown(`motion-${mode}-remove`),
    },
  );
  if (options.matchMedia !== false) {
    window.matchMedia = (query) => {
      assert.equal(query, '(prefers-reduced-motion: reduce)');
      return mediaQuery;
    };
  }

  let nextFrameId = 1;
  const frames = new Map();
  const cancelledFrames = [];
  const requestAnimationFrame = options.animationFrame === false ? undefined : (callback) => {
    attemptSetup('raf-schedule');
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  };
  const cancelAnimationFrame = options.animationFrame === false ? undefined : (id) => {
    cancelledFrames.push(id);
    frames.delete(id);
    attemptTeardown('raf-cancel');
  };

  const intersectionObservers = [];
  const IntersectionObserver = options.intersectionObserver === false ? undefined : class {
    constructor(callback, observerOptions) {
      attemptSetup('intersection-construction');
      this.callback = callback;
      this.options = observerOptions;
      this.observed = [];
      this.disconnectCalls = 0;
      intersectionObservers.push(this);
    }

    disconnect() {
      this.disconnectCalls += 1;
      attemptTeardown('intersection-disconnect');
    }

    emit(isIntersecting) {
      this.callback([{
        intersectionRatio: isIntersecting ? 1 : 0,
        isIntersecting,
        target: hero,
      }]);
    }

    observe(target) {
      attemptSetup('intersection-observe');
      this.observed.push(target);
    }
  };

  const resizeObservers = [];
  const ResizeObserver = options.resizeObserver === false ? undefined : class {
    constructor(callback) {
      attemptSetup('resize-construction');
      this.callback = callback;
      this.observed = [];
      this.disconnectCalls = 0;
      resizeObservers.push(this);
    }

    disconnect() {
      this.disconnectCalls += 1;
      attemptTeardown('resize-disconnect');
    }

    emit() {
      this.callback([{ target: canvas }]);
    }

    observe(target) {
      attemptSetup('resize-observe');
      this.observed.push(target);
    }
  };

  const descriptors = new Map(
    GLOBAL_KEYS.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );

  return {
    cancelledFrames,
    canvas,
    canvasRect,
    context,
    document,
    frames,
    hero,
    heroRect,
    intersectionObservers,
    mediaQuery,
    resizeObservers,
    setupAttempts,
    teardownAttempts,
    window,
    install() {
      setGlobal('document', document);
      setGlobal('window', window);
      setGlobal('IntersectionObserver', IntersectionObserver);
      setGlobal('ResizeObserver', ResizeObserver);
      setGlobal('requestAnimationFrame', requestAnimationFrame);
      setGlobal('cancelAnimationFrame', cancelAnimationFrame);
      setGlobal('performance', options.performance === false ? undefined : { now: () => 250 });
      return () => {
        for (const [key, descriptor] of descriptors) {
          if (descriptor) Object.defineProperty(globalThis, key, descriptor);
          else Reflect.deleteProperty(globalThis, key);
        }
      };
    },
    runFrame(time = 300) {
      const next = frames.entries().next().value;
      assert.ok(next, 'an animation frame must be pending');
      const [id, callback] = next;
      frames.delete(id);
      callback(time);
    },
  };
}

function withHarness(options, assertion) {
  const harness = createHarness(options);
  const restore = harness.install();
  try {
    assertion(harness);
  } finally {
    restore();
  }
}

function callsFor(context, method) {
  return context.calls.filter((call) => call.method === method);
}

function captureDrawState(context) {
  return structuredClone({ calls: context.calls, writes: context.writes });
}

function assertResourcesReleased(harness) {
  assert.equal(harness.frames.size, 0, 'no animation frame may leak');
  for (const observer of [
    ...harness.intersectionObservers,
    ...harness.resizeObservers,
  ]) {
    assert.equal(observer.disconnectCalls, 1, 'constructed observers must disconnect once');
  }
  for (const target of [harness.window, harness.hero, harness.document]) {
    for (const { type, listener } of target.added) {
      assert.ok(
        target.removed.some((removed) => removed.type === type && removed.listener === listener),
        `${target.name}:${type} attempted listener must be removed`,
      );
      assert.equal(target.listenerCount(type), 0, `${target.name}:${type} must not remain active`);
    }
  }
  for (const listener of harness.mediaQuery.added) {
    assert.ok(harness.mediaQuery.removed.includes(listener), 'motion listener must be removed');
  }
  assert.equal(harness.mediaQuery.listeners.length, 0, 'motion listener must not remain active');
}

function declarationValue(body, property) {
  const match = body.match(new RegExp(`(?:^|;)\\s*${property.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*:\\s*([^;]+)`));
  return match?.[1].trim();
}

test('shouldAnimate permits motion only when visible and not reduced', () => {
  assert.equal(shouldAnimate({ reducedMotion: true, visible: true }), false);
  assert.equal(shouldAnimate({ reducedMotion: false, visible: false }), false);
  assert.equal(shouldAnimate({ reducedMotion: true, visible: false }), false);
  assert.equal(shouldAnimate({ reducedMotion: false, visible: true }), true);
});

test('sphere builders return deterministic, normalized, separately allocated geometry', () => {
  const first = buildSphereParticles(480);
  const second = buildSphereParticles(480);
  const connections = buildSphereConnections(first);
  const repeatedConnections = buildSphereConnections(second);

  assert.deepEqual(second, first);
  assert.notEqual(first, second);
  assert.notEqual(first[0], second[0]);
  assert.ok(first.length >= 200 && first.length <= 320);
  assert.deepEqual(repeatedConnections, connections);
  assert.notEqual(connections, repeatedConnections);
  assert.ok(connections.length > first.length / 3);
  assert.ok(connections.length <= first.length * 2);
  for (const particle of first) {
    assert.ok(['x', 'y', 'z'].every((axis) => Number.isFinite(particle[axis])));
    assert.ok(Math.hypot(particle.x, particle.y, particle.z) <= 1.001);
    assert.ok(Math.hypot(particle.x, particle.y, particle.z) >= 0.48);
    assert.ok(['ai', 'platform', 'data', 'human'].includes(particle.kind));
    assert.ok(particle.layer >= 0 && particle.layer <= 1);
    assert.ok(Number.isFinite(particle.size) && particle.size >= 0.7 && particle.size <= 3);
  }
  for (const [from, to] of connections) {
    assert.ok(Number.isInteger(from) && from >= 0 && from < first.length);
    assert.ok(Number.isInteger(to) && to >= 0 && to < first.length);
    assert.notEqual(from, to);
  }
});

test('sphere density adapts to canvas width within a bounded budget', () => {
  const compact = buildSphereParticles(260);
  const desktop = buildSphereParticles(620);
  assert.ok(compact.length < desktop.length);
  assert.ok(compact.length >= 100);
  assert.ok(desktop.length <= 320);
});

test('missing or null canvas context returns an idempotent no-op cleanup', () => {
  for (const contextMode of ['missing', null]) {
    withHarness({ context: contextMode }, (harness) => {
      const cleanup = initSystemMap(harness.canvas);
      assert.equal(typeof cleanup, 'function');
      assert.doesNotThrow(() => cleanup());
      assert.doesNotThrow(() => cleanup());
      assert.equal(harness.hero.added.length, 0);
      assert.equal(harness.window.added.length, 0);
      assert.equal(harness.mediaQuery.listeners.length, 0);
      assert.equal(harness.intersectionObservers.length, 0);
      assert.equal(harness.resizeObservers.length, 0);
      assert.equal(harness.frames.size, 0);
    });
  }
});

test('initial resize caps DPR and draws a bounded text-free particle sphere', () => {
  withHarness({
    canvasRect: { height: 180.2, width: 320.4 },
    devicePixelRatio: 3,
    reducedMotion: true,
  }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);

    assert.equal(harness.canvas.width, 641);
    assert.equal(harness.canvas.height, 360);
    assert.deepEqual(callsFor(harness.context, 'setTransform').at(-1).args, [2, 0, 0, 2, 0, 0]);
    assert.deepEqual(callsFor(harness.context, 'clearRect').at(-1).args, [0, 0, 320.4, 180.2]);
    assert.ok(callsFor(harness.context, 'lineTo').length >= 40);
    assert.ok(callsFor(harness.context, 'lineTo').length <= 500);
    assert.ok(callsFor(harness.context, 'arc').length >= 100);
    assert.equal(callsFor(harness.context, 'fillText').length, 0);
    assert.ok(harness.context.writes.some(({ property, value }) => property === 'lineWidth' && value === 0.7));
    assert.ok(harness.context.writes.some(({ property, value }) => property === 'strokeStyle' && value === 'rgba(8, 112, 94, 0.18)'));
    for (const color of ['#08705e', '#15191b', '#c49a2f', '#59635f']) {
      assert.ok(harness.context.writes.some(({ property, value }) => property === 'fillStyle' && value === color));
    }

    cleanup();
  });
});

test('reduced motion is absolutely stable across pointer input and resumes when disabled', () => {
  withHarness({ reducedMotion: true }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    const stableState = captureDrawState(harness.context);
    const stableSize = { height: harness.canvas.height, width: harness.canvas.width };

    assert.equal(callsFor(harness.context, 'clearRect').length, 1);
    assert.equal(harness.frames.size, 0);
    harness.hero.emit('pointermove', { clientX: -10_000, clientY: 10_000 });
    harness.hero.emit('pointermove', { clientX: Number.NaN, clientY: Number.POSITIVE_INFINITY });
    assert.deepEqual(captureDrawState(harness.context), stableState);
    assert.deepEqual(
      { height: harness.canvas.height, width: harness.canvas.width },
      stableSize,
    );

    harness.mediaQuery.emit(false);
    assert.equal(harness.frames.size, 1);
    harness.hero.emit('pointermove', { clientX: 800, clientY: 0 });
    harness.runFrame();
    assert.notDeepEqual(captureDrawState(harness.context), stableState);

    cleanup();
  });
});

test('switching to reduced motion resets pointer parallax before the static draw', () => {
  withHarness({}, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    harness.hero.emit('pointermove', { clientX: 800, clientY: 0 });
    harness.runFrame();
    const particleCount = buildSphereParticles(400).length;
    const parallaxPoint = callsFor(harness.context, 'arc').at(-particleCount).args.slice(0, 2);

    harness.mediaQuery.emit(true);
    const resetPoint = callsFor(harness.context, 'arc').at(-particleCount).args.slice(0, 2);
    assert.notDeepEqual(resetPoint, parallaxPoint);
    assert.equal(harness.frames.size, 0);

    cleanup();
  });
});

test('normal visible state keeps at most one animation frame scheduled', () => {
  withHarness({}, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    const observer = harness.intersectionObservers[0];

    assert.equal(harness.frames.size, 1);
    observer.emit(true);
    assert.equal(harness.frames.size, 1);
    observer.emit(true);
    assert.equal(harness.frames.size, 1);
    harness.mediaQuery.emit(false);
    assert.equal(harness.frames.size, 1);
    harness.runFrame();
    assert.equal(harness.frames.size, 1);
    assert.equal(callsFor(harness.context, 'clearRect').length, 1);

    cleanup();
  });
});

test('intersection invisibility stops animation and visibility resumes one frame', () => {
  withHarness({}, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    const observer = harness.intersectionObservers[0];

    assert.deepEqual(observer.options, { threshold: 0.01 });
    assert.deepEqual(observer.observed, [harness.hero]);
    observer.emit(false);
    assert.equal(harness.frames.size, 0);
    assert.equal(callsFor(harness.context, 'clearRect').length, 1, 'invisible state draws a static frame');
    observer.emit(true);
    assert.equal(harness.frames.size, 1);

    cleanup();
  });
});

test('missing IntersectionObserver renders statically even when RAF is available', () => {
  withHarness({ intersectionObserver: false }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);

    assert.equal(callsFor(harness.context, 'clearRect').length, 1);
    assert.equal(callsFor(harness.context, 'arc').length, buildSphereParticles(400).length + 1);
    assert.equal(harness.frames.size, 0);

    cleanup();
  });
});

test('document visibility pauses animation and resumes only while the hero intersects', () => {
  withHarness({}, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    const observer = harness.intersectionObservers[0];

    assert.equal(harness.document.listenerCount('visibilitychange'), 1);
    assert.equal(harness.frames.size, 1);
    harness.document.visibilityState = 'hidden';
    harness.document.emit('visibilitychange');
    assert.equal(harness.frames.size, 0);
    assert.equal(callsFor(harness.context, 'clearRect').length, 1);

    harness.document.visibilityState = 'visible';
    harness.document.emit('visibilitychange');
    assert.equal(harness.frames.size, 1);
    observer.emit(false);
    assert.equal(harness.frames.size, 0);
    harness.document.emit('visibilitychange');
    assert.equal(harness.frames.size, 0, 'page visibility alone must not override hero invisibility');
    observer.emit(true);
    assert.equal(harness.frames.size, 1);

    cleanup();
  });
});

test('ResizeObserver and window resize fallback both resize and redraw', () => {
  withHarness({ reducedMotion: true }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    assert.deepEqual(harness.resizeObservers[0].observed, [harness.canvas]);
    harness.canvasRect.width = 250;
    harness.canvasRect.height = 100;
    harness.resizeObservers[0].emit();
    assert.equal(harness.canvas.width, 250);
    assert.equal(harness.canvas.height, 100);
    assert.equal(callsFor(harness.context, 'clearRect').length, 2);
    cleanup();
  });

  withHarness({ reducedMotion: true, resizeObserver: false }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    assert.equal(harness.window.listenerCount('resize'), 1);
    harness.canvasRect.width = 275;
    harness.canvasRect.height = 125;
    harness.window.emit('resize');
    assert.equal(harness.canvas.width, 275);
    assert.equal(harness.canvas.height, 125);
    assert.equal(callsFor(harness.context, 'clearRect').length, 2);
    cleanup();
  });
});

test('pointer input clamps parallax and zero-sized hero rect never draws nonfinite coordinates', () => {
  withHarness({}, (harness) => {
    const cleanup = initSystemMap(harness.canvas);

    harness.hero.emit('pointermove', { clientX: 10_000, clientY: -10_000 });
    harness.runFrame();
    const particleCount = buildSphereParticles(400).length;
    const firstClampedArc = callsFor(harness.context, 'arc').at(-particleCount).args.slice(0, 2);
    harness.hero.emit('pointermove', { clientX: 100_000, clientY: -100_000 });
    harness.runFrame();
    const secondClampedArc = callsFor(harness.context, 'arc').at(-particleCount).args.slice(0, 2);
    assert.deepEqual(secondClampedArc, firstClampedArc);

    harness.heroRect.width = 0;
    harness.heroRect.height = 0;
    harness.hero.emit('pointermove', { clientX: Number.POSITIVE_INFINITY, clientY: Number.NaN });
    harness.runFrame();
    for (const { method, args } of harness.context.calls) {
      const numericArgs = method === 'fillText' ? args.slice(1) : args;
      assert.ok(numericArgs.every(Number.isFinite), `${method} draw coordinates must remain finite`);
    }

    cleanup();
  });
});

test('compact canvases retain particles and connections without canvas text', () => {
  withHarness({
    canvasRect: { height: 174, width: 319 },
    reducedMotion: true,
  }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);

    assert.ok(callsFor(harness.context, 'lineTo').length > 30);
    assert.equal(callsFor(harness.context, 'arc').length, buildSphereParticles(319).length + 1);
    assert.equal(callsFor(harness.context, 'fillText').length, 0);

    cleanup();
  });
});

test('supported canvas widths remain free of embedded labels', () => {
  withHarness({
    canvasRect: { height: 197.4375, width: 351 },
    reducedMotion: true,
  }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);

    assert.equal(callsFor(harness.context, 'fillText').length, 0);

    cleanup();
  });
});

test('motion query supports modern, legacy, and missing matchMedia paths', () => {
  for (const mediaMode of ['modern', 'legacy']) {
    withHarness({ mediaMode, reducedMotion: true }, (harness) => {
      const cleanup = initSystemMap(harness.canvas);
      assert.equal(harness.mediaQuery.listeners.length, 1);
      harness.mediaQuery.emit(false);
      assert.equal(harness.frames.size, 1);
      cleanup();
      assert.equal(harness.mediaQuery.listeners.length, 0);
      assert.equal(harness.mediaQuery.removed.length, 1);
    });
  }

  withHarness({ animationFrame: false, matchMedia: false }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    assert.equal(callsFor(harness.context, 'clearRect').length, 1);
    assert.doesNotThrow(() => cleanup());
  });
});

test('missing observers, animation APIs, matchMedia, and performance still render statically', () => {
  withHarness({
    animationFrame: false,
    intersectionObserver: false,
    matchMedia: false,
    performance: false,
    resizeObserver: false,
  }, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    assert.equal(callsFor(harness.context, 'clearRect').length, 1);
    assert.equal(callsFor(harness.context, 'arc').length, buildSphereParticles(400).length + 1);
    assert.equal(harness.frames.size, 0);
    assert.equal(harness.window.listenerCount('resize'), 1);
    assert.doesNotThrow(() => cleanup());
    assert.doesNotThrow(() => cleanup());
  });
});

test('initialization failures transactionally release every earlier resource', async (t) => {
  const matrix = [
    ['intersection-construction', {}],
    ['intersection-observe', {}],
    ['resize-construction', {}],
    ['resize-observe', {}],
    ['window-resize-add', { resizeObserver: false }],
    ['hero-pointer-add', {}],
    ['motion-modern-add', {}],
    ['motion-legacy-add', { mediaMode: 'legacy' }],
    ['document-visibility-add', {}],
    ['canvas-resize', {}],
    ['canvas-draw', { reducedMotion: true }],
    ['raf-schedule', {}],
  ];

  for (const [failAt, options] of matrix) {
    await t.test(failAt, () => {
      withHarness({ ...options, failAt }, (harness) => {
        assert.throws(() => initSystemMap(harness.canvas), new RegExp(failAt));
        assert.equal(harness.setupAttempts.at(-1), failAt, 'later setup must not run');
        assertResourcesReleased(harness);
      });
    });
  }
});

test('cleanup continues after individual teardown failures and remains idempotent', () => {
  for (const failTeardownAt of [
    'intersection-disconnect',
    'hero-pointer-remove',
    'motion-modern-remove',
    'document-visibility-remove',
  ]) {
    withHarness({ failTeardownAt }, (harness) => {
      const cleanup = initSystemMap(harness.canvas);
      assert.doesNotThrow(() => cleanup(), failTeardownAt);
      assert.doesNotThrow(() => cleanup(), `${failTeardownAt} idempotent cleanup`);
      assertResourcesReleased(harness);
    });
  }
});

test('cleanup cancels frames, disconnects observers, removes listeners, and is idempotent', () => {
  withHarness({}, (harness) => {
    const cleanup = initSystemMap(harness.canvas);
    const intersectionObserver = harness.intersectionObservers[0];
    const resizeObserver = harness.resizeObservers[0];

    assert.equal(harness.frames.size, 1);
    assert.equal(harness.hero.listenerCount('pointermove'), 1);
    cleanup();
    cleanup();

    assert.equal(harness.frames.size, 0);
    assert.equal(harness.cancelledFrames.length, 1);
    assert.equal(intersectionObserver.disconnectCalls, 1);
    assert.equal(resizeObserver.disconnectCalls, 1);
    assert.equal(harness.hero.listenerCount('pointermove'), 0);
    assert.equal(harness.window.listenerCount('resize'), 0);
    assert.equal(harness.document.listenerCount('visibilitychange'), 0);
    assert.equal(harness.mediaQuery.listeners.length, 0);
    assert.equal(harness.hero.removed.filter(({ type }) => type === 'pointermove').length, 1);
  });
});

test('hero markup and responsive canvas dimensions retain the system-map contract', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const canvases = [...html.matchAll(/<canvas\b[^>]*\bid=["']system-map["'][^>]*>/g)];

  assert.equal(canvases.length, 1);
  assert.match(canvases[0][0], /\bclass=["'][^"']*\bsystem-map\b[^"']*["']/);
  assert.match(canvases[0][0], /\baria-hidden=["']true["']/);
  const heroStart = html.search(/<section\b[^>]*\bclass=["'][^"']*\bhero\b[^"']*["']/);
  const heroContent = html.indexOf('class="content-shell hero-content"', heroStart);
  const heroCopy = html.indexOf('class="hero-copy"', heroContent);
  assert.ok(heroStart >= 0 && heroContent > heroStart && heroCopy > heroContent && canvases[0].index > heroCopy);

  const rules = [...css.matchAll(/\.system-map\s*\{([^}]*)\}/g)];
  assert.equal(rules.length, 3);
  const desktop = rules[0][1];
  const mobile = rules[2][1];
  assert.equal(declarationValue(desktop, 'position'), 'relative');
  assert.equal(declarationValue(desktop, 'width'), '100%');
  assert.equal(declarationValue(desktop, 'aspect-ratio'), '1');
  assert.equal(declarationValue(desktop, 'pointer-events'), 'none');
  assert.match(css.slice(0, rules[2].index), /@media \(max-width: 600px\)[\s\S]*$/);
  assert.equal(declarationValue(mobile, 'width'), 'min(62vw, 220px)');
  assert.equal(declarationValue(mobile, 'justify-self'), 'center');
});
