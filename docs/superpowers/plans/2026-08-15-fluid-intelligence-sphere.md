# Fluid Intelligence Sphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed hero node map with a responsive, animated particle sphere that participates in normal hero layout flow.

**Architecture:** Keep the dependency-free canvas lifecycle and progressive enhancement boundaries. Introduce deterministic normalized particle generation and projection, restructure the hero as a copy/visual grid, and preserve reduced-motion, visibility, resize, and cleanup behavior.

**Tech Stack:** HTML5, CSS Grid, Canvas 2D, JavaScript ES modules, Node.js test runner, Playwright

---

### Task 1: Define The Fluid Hero Contract

**Files:**
- Modify: `tests/dom.test.mjs`
- Modify: `tests/styles.test.mjs`
- Modify: `tests/system-map.test.mjs`
- Modify: `tests/visual.spec.mjs`

- [ ] **Step 1: Protect the new semantic structure**

Require `.hero-content` to contain a `.hero-copy` wrapper followed by the decorative canvas, while preserving the exact visible hero text and `aria-hidden="true"` canvas contract.

- [ ] **Step 2: Replace fixed-position CSS expectations**

Assert the desktop layout contract:

```js
assertDeclaration('.hero-content', 'display', 'grid');
assertDeclaration('.hero-content', 'grid-template-columns', 'minmax(0, 1.08fr) minmax(320px, 0.92fr)');
assertDeclaration('.hero-content', 'align-items', 'center');
assertDeclaration('.system-map', 'position', 'relative');
assertDeclaration('.system-map', 'width', '100%');
assertDeclaration('.system-map', 'aspect-ratio', '1');
```

At `max-width: 900px`, require a single-column grid. At `max-width: 600px`, require a constrained fluid canvas width using `min(100%, 420px)` and no absolute offsets.

- [ ] **Step 3: Define deterministic sphere data expectations**

Replace the eight-node fixture with tests for exported `buildSphereParticles()` and `buildSphereConnections()` functions. Verify that repeated calls are deeply equal but separately allocated, all coordinates and depths are finite and normalized, all four palette kinds occur, connection indices are valid, and compact density is lower than desktop density.

- [ ] **Step 4: Update rendering assertions**

Require a nontrivial particle count, more arcs than the old eight-node visual, no embedded canvas text, finite drawing coordinates, and stable reduced-motion frames. Preserve lifecycle, observer, resize, fallback, and cleanup assertions.

- [ ] **Step 5: Run focused tests and verify failure**

```bash
node --test tests/dom.test.mjs tests/styles.test.mjs tests/system-map.test.mjs
```

Expected: FAIL because the current HTML, CSS, and canvas renderer still implement the fixed node map.

### Task 2: Build The Responsive Particle Sphere

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Replace internals: `assets/js/system-map.js`

- [ ] **Step 1: Move the canvas into normal hero flow**

Use this structure inside the existing hero content shell:

```html
<div class="content-shell hero-content">
  <div class="hero-copy">
    <!-- existing name, role, heading, summary, actions, and social links -->
  </div>
  <canvas id="system-map" class="system-map" aria-hidden="true"></canvas>
</div>
```

- [ ] **Step 2: Implement the fluid grid**

Use a two-column desktop grid with intrinsic `minmax()` tracks, a square canvas, and no absolute canvas positioning. Stack to one column at the existing `900px` breakpoint, center the visual column, and cap it with `width: min(100%, 420px)` on mobile. Keep all dimensions responsive to the containing grid.

- [ ] **Step 3: Generate deterministic normalized particles**

Create a seeded generator that distributes particles through concentric spherical layers. Store normalized longitude, latitude, radius, depth offset, size, and palette kind. Generate desktop and compact counts from the current canvas width without using layout pixel coordinates in the data model.

- [ ] **Step 4: Project and render the sphere**

Project particles into the current square canvas using its measured center and radius. Rotate longitude slowly over time, apply bounded pointer tilt, sort by projected depth, draw restrained nearby connections, then draw low-opacity outer particles and stronger foreground particles in the existing teal/gold/charcoal palette.

- [ ] **Step 5: Keep the visual text-free**

Render only the circular shell, connections, and particles so the visual supports rather than competes with the hero copy.

- [ ] **Step 6: Preserve runtime resilience**

Retain the existing idempotent cleanup, DPR cap, ResizeObserver fallback, visibility pause, IntersectionObserver pause, matchMedia compatibility, reduced-motion static frame, and fail-closed initialization cleanup.

- [ ] **Step 7: Run focused tests**

```bash
node --test tests/dom.test.mjs tests/styles.test.mjs tests/system-map.test.mjs
```

Expected: all focused tests pass.

### Task 3: Verify Visual Quality And Performance

**Files:**
- Verify: `index.html`
- Verify: `assets/css/styles.css`
- Verify: `assets/js/system-map.js`

- [ ] **Step 1: Run the complete suite and local-link check**

```bash
npm test
npm run check:links
git diff --check
```

Expected: all commands exit successfully with zero failures.

- [ ] **Step 2: Run Playwright visual checks**

```bash
npm run test:visual
```

Expected: all desktop, tablet, mobile, reduced-motion, no-JavaScript, and accessibility checks pass.

- [ ] **Step 3: Inspect generated screenshots and canvas pixels**

Confirm the sphere is visibly nonblank, visually circular, separated from copy, contained at `1440x1000`, `901x900`, `601x900`, and mobile widths, and that the first viewport still hints at the impact section.

- [ ] **Step 4: Confirm bounded work per frame**

Verify particle and connection arrays are generated only during initialization or density-changing resize, not rebuilt on every animation frame. Confirm animation stops when offscreen, hidden, or reduced-motion is active.

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/styles.css assets/js/system-map.js tests/dom.test.mjs tests/styles.test.mjs tests/system-map.test.mjs tests/visual.spec.mjs docs/superpowers/plans/2026-08-15-fluid-intelligence-sphere.md
git commit -m "Build fluid intelligence sphere hero"
```
