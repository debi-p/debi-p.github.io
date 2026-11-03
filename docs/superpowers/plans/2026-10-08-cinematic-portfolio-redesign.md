# Cinematic Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing static portfolio into a bold, futuristic, dark cinematic experience while preserving its content, progressive enhancement, accessibility, and GitHub Pages deployment model.

**Architecture:** Keep `index.html` as the semantic source of truth, `assets/css/styles.css` as the responsive visual system, and the existing modular JavaScript entry point for isolated enhancements. Add one focused metrics module, retain JSON-driven project rendering and case-study content modules, and verify every stage with the existing Node and Playwright suites.

**Tech Stack:** Semantic HTML5, CSS custom properties and responsive layout, vanilla ES modules, Canvas 2D, JSON, Node test runner, Playwright, GitHub Pages.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Semantic page structure, content order, photo slots, controls, and fallbacks |
| `assets/css/styles.css` | Dark design tokens, responsive compositions, states, motion, and accessibility |
| `assets/js/main.js` | Independent initializer orchestration and existing UI behavior |
| `assets/js/impact-metrics.js` | One-time, reduced-motion-safe numeric metric animation |
| `assets/js/system-map.js` | Futuristic dark-theme network rendering and pointer response |
| `assets/js/render-projects.js` | Safe project-card markup generated from `public.json` |
| `assets/js/content.js` | Existing enterprise case-study records |
| `assets/images/debi-prasad-profile.webp` | Temporary hero portrait; later replaced at the same path or via markup |
| `assets/images/experience-placeholder.webp` | Temporary wide visual for Experience |
| `assets/images/contact-placeholder.webp` | Temporary wide visual for Contact |
| `tests/dom.test.mjs` | Semantic structure, content, link, and control contracts |
| `tests/styles.test.mjs` | Design-token, layout, responsive, focus, and motion contracts |
| `tests/main.test.mjs` | Static initializer and module-boundary contracts |
| `tests/main-runtime.test.mjs` | Initializer isolation and browser API failure behavior |
| `tests/impact-metrics.test.mjs` | Metric parsing, animation, reduced motion, and cleanup |
| `tests/render-projects.test.mjs` | Generated project-card markup and URL safety |
| `tests/system-map.test.mjs` | Canvas geometry, dark palette, motion, and fallback behavior |
| `tests/visual.spec.mjs` | Desktop/mobile rendering, overflow, interactions, and console errors |
| `artifacts/portfolio-desktop.png` | Updated desktop verification capture |
| `artifacts/portfolio-mobile.png` | Updated mobile verification capture |

---

### Task 1: Establish The Cinematic Design System

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `tests/styles.test.mjs`

- [ ] **Step 1: Write failing token and global-surface tests**

Add assertions that require the approved dark palette and prevent a light page canvas:

```js
test('defines the cinematic dark design tokens', () => {
  assertDeclaration(':root', '--canvas', '#071527');
  assertDeclaration(':root', '--surface', '#0d1d31');
  assertDeclaration(':root', '--surface-raised', '#14263b');
  assertDeclaration(':root', '--ink', '#f7fbff');
  assertDeclaration(':root', '--ink-soft', '#aebdca');
  assertDeclaration(':root', '--cyan', '#63d8d1');
  assertDeclaration(':root', '--rule', 'rgba(128, 220, 217, 0.2)');
});

test('uses the dark canvas across the document', () => {
  assertDeclaration('body', 'background', 'var(--canvas)');
  assertDeclaration('body', 'color', 'var(--ink)');
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `node --test tests/styles.test.mjs`

Expected: FAIL because the cinematic tokens and dark body surface do not exist.

- [ ] **Step 3: Replace the root palette and global primitives**

Define these tokens and update body, links, focus rings, selection, headings, section spacing, and reusable controls to consume them:

```css
:root {
  --canvas: #071527;
  --surface: #0d1d31;
  --surface-raised: #14263b;
  --ink: #f7fbff;
  --ink-soft: #aebdca;
  --cyan: #63d8d1;
  --cyan-strong: #20bfb8;
  --rule: rgba(128, 220, 217, 0.2);
  --glow: 0 18px 52px rgba(31, 198, 191, 0.16);
}

body {
  background: var(--canvas);
  color: var(--ink);
}

:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 4px;
}
```

Remove obsolete cream/light-surface declarations rather than layering dark overrides beneath them.

- [ ] **Step 4: Run tests and inspect prohibited-pattern checks**

Run: `node --test tests/styles.test.mjs`

Expected: PASS, including existing radius, typography, overlap, focus, and no-gradient restrictions.

- [ ] **Step 5: Commit the design-system foundation**

```bash
git add assets/css/styles.css tests/styles.test.mjs
git commit -m "style: establish cinematic portfolio theme"
```

---

### Task 2: Rebuild Navigation And Hero Composition

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Modify: `tests/dom.test.mjs`
- Modify: `tests/styles.test.mjs`

- [ ] **Step 1: Write failing semantic and visual-contract tests**

Require the hero portrait frame, proof strip, highlighted phrase, and conversation action without changing link destinations:

```js
const hero = elementBlock({ tag: 'section', className: 'hero' }, 'hero must exist');
assert.ok(hero.includes('class="hero-portrait-frame"'));
assert.ok(hero.includes('class="hero-proof"'));
assert.ok(hero.includes('class="hero-accent"'));
assert.ok(hasLink(hero, { href: 'assets/resume/Debi_Prasad.pdf' }));
```

Add CSS assertions for `.hero`, `.hero-content`, `.hero-portrait-frame`, `.hero-copy`, `.hero-proof`, and the `max-width: 900px` and `max-width: 600px` layouts.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node --test tests/dom.test.mjs tests/styles.test.mjs`

Expected: FAIL for missing cinematic hero structures and selectors.

- [ ] **Step 3: Refactor the hero markup**

Keep the existing `h1`, profile image path, resume URLs, achievement facts, and system-map canvas. Use this hierarchy:

```html
<div class="content-shell hero-content">
  <figure class="hero-portrait-frame">
    <img class="hero-profile" src="assets/images/debi-prasad-profile.webp" alt="" width="960" height="1279">
  </figure>
  <div class="hero-copy">
    <p class="eyebrow">Staff Software Engineer · AI Platforms &amp; Distributed Systems</p>
    <p class="hero-name">Debi Prasad Pradhan</p>
    <h1 id="hero-title">Engineering intelligent systems for <span class="hero-accent">real-world scale</span></h1>
    <p class="hero-summary">11+ years turning complex enterprise problems into secure, scalable platforms, while leading teams from architecture through production.</p>
    <div class="hero-actions">...</div>
    <dl class="hero-proof">...</dl>
  </div>
</div>
```

Place the animated network and extended impact presentation in the next in-flow block so portrait, text, and metrics never overlap.

- [ ] **Step 4: Implement the desktop and responsive hero CSS**

Use a two-column composition with stable tracks, a framed 4:5 portrait, compact proof cells, and a visible hint of the next section. At `900px`, narrow the portrait; at `600px`, stack portrait before copy, reduce visual decoration, and keep actions full-width where needed.

- [ ] **Step 5: Run focused tests and capture the hero**

Run: `node --test tests/dom.test.mjs tests/styles.test.mjs`

Run: `npm run serve`

Capture the hero at `1440x900` and `390x844` with the existing Playwright capture helper.

Expected: portrait and copy are visible without overlap, the next section is hinted on desktop, and mobile has no horizontal overflow.

- [ ] **Step 6: Commit the navigation and hero**

```bash
git add index.html assets/css/styles.css tests/dom.test.mjs tests/styles.test.mjs
git commit -m "feat: build cinematic portfolio hero"
```

---

### Task 3: Add Impact Metrics And Dark Network Visualization

**Files:**
- Create: `assets/js/impact-metrics.js`
- Create: `tests/impact-metrics.test.mjs`
- Modify: `assets/js/main.js`
- Modify: `assets/js/system-map.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/main.test.mjs`
- Modify: `tests/main-runtime.test.mjs`
- Modify: `tests/system-map.test.mjs`

- [ ] **Step 1: Write failing pure-function metric tests**

Define and test a parser that separates numeric magnitude from display suffix:

```js
import { parseMetric, renderMetricFrame } from '../assets/js/impact-metrics.js';

test('parses portfolio metric values', () => {
  assert.deepEqual(parseMetric('67%'), { value: 67, suffix: '%' });
  assert.deepEqual(parseMetric('3X'), { value: 3, suffix: 'X' });
  assert.deepEqual(parseMetric('20+'), { value: 20, suffix: '+' });
  assert.deepEqual(parseMetric('1TB'), { value: 1, suffix: 'TB' });
});

test('renders bounded whole-number frames', () => {
  assert.equal(renderMetricFrame({ value: 67, suffix: '%' }, 0.5), '34%');
  assert.equal(renderMetricFrame({ value: 3, suffix: 'X' }, 2), '3X');
});
```

- [ ] **Step 2: Run the new test and confirm failure**

Run: `node --test tests/impact-metrics.test.mjs`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the isolated metric module**

Export `parseMetric`, `renderMetricFrame`, and `initImpactMetrics(elements, environment = window)`. `initImpactMetrics` must:

- Read each element's `data-metric-value`.
- Render final values immediately for reduced motion or missing `IntersectionObserver`/`requestAnimationFrame`.
- Animate once when the impact region first intersects.
- Return an idempotent cleanup that cancels frames and disconnects observers.
- Never throw when passed an empty collection.

- [ ] **Step 4: Add a fail-isolated initializer in `main.js`**

Import `initImpactMetrics`, query `[data-metric-value]`, and register it through the existing `runSafely` boundary. Add source and runtime tests proving a metric failure does not block projects, navigation, dialog setup, reveals, system-map initialization, or footer hydration.

- [ ] **Step 5: Update the system-map palette**

Replace light-theme stroke and particle values with cyan, cool white, and muted blue values derived from the CSS theme. Preserve deterministic geometry, bounded density, reduced-motion stability, resize handling, and cleanup behavior.

- [ ] **Step 6: Run metric, system-map, and initializer tests**

Run: `node --test tests/impact-metrics.test.mjs tests/system-map.test.mjs tests/main.test.mjs tests/main-runtime.test.mjs`

Expected: PASS with no unhandled rejections and no nonfinite canvas coordinates.

- [ ] **Step 7: Commit the impact experience**

```bash
git add assets/js/impact-metrics.js assets/js/main.js assets/js/system-map.js assets/css/styles.css tests/impact-metrics.test.mjs tests/main.test.mjs tests/main-runtime.test.mjs tests/system-map.test.mjs
git commit -m "feat: add animated impact network"
```

---

### Task 4: Transform Enterprise Systems Into Visual Stories

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Modify: `tests/dom.test.mjs`
- Modify: `tests/styles.test.mjs`
- Verify: `assets/js/content.js`
- Verify: `assets/js/main.js`

- [ ] **Step 1: Write failing system-card structure tests**

Require exactly four `.system-card` articles, each with category, title, summary, two proof points, and one existing case-study trigger:

```js
const systems = elementBlock({ tag: 'section', id: 'systems' });
assert.equal(elementBlocks(systems, { tag: 'article', className: 'system-card' }).length, 4);
assert.equal(openingTags(systems, 'button').filter((tag) => hasAttribute(tag, 'data-case-study')).length, 4);
assert.equal(elementBlocks(systems, { tag: 'ul', className: 'system-proof' }).length, 4);
```

- [ ] **Step 2: Run focused DOM tests and confirm failure**

Run: `node --test tests/dom.test.mjs`

Expected: FAIL because the current systems are rows rather than visual cards.

- [ ] **Step 3: Convert system rows to semantic cards**

Keep the existing four IDs used by `content.js`: Mesh, PyIntelligence, MolecularGraph, and ReleaseHub. Add decorative system-visual containers that use CSS grids, nodes, trace lines, and data marks rather than copied third-party imagery.

- [ ] **Step 4: Implement two-column and mobile card layouts**

Cards use stable minimum heights, a single framed surface, visible proof lists, and an illuminated action. On mobile, cards stack and decorative visuals reduce in density. Do not place cards inside cards.

- [ ] **Step 5: Verify dialog behavior and keyboard focus**

Run: `node --test tests/dom.test.mjs tests/main-runtime.test.mjs tests/content.test.mjs`

Expected: all four triggers remain hidden until dialog setup succeeds, dialogs restore focus to their trigger, and case-study facts remain unchanged.

- [ ] **Step 6: Commit enterprise system stories**

```bash
git add index.html assets/css/styles.css tests/dom.test.mjs tests/styles.test.mjs
git commit -m "feat: present enterprise systems as visual stories"
```

---

### Task 5: Restyle Experience And Engineering Capability

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Modify: `tests/dom.test.mjs`
- Modify: `tests/styles.test.mjs`

- [ ] **Step 1: Write failing layout tests**

Require an in-flow experience visual, four chronological entries, and the existing capability group count. Add CSS contracts for the timeline rail, current-role emphasis, capability grid, and responsive collapse.

```js
assert.equal(elementBlocks(html, { tag: 'article', className: 'timeline-item' }).length, 4);
assert.ok(elementBlock({ tag: 'section', id: 'experience' }).includes('class="experience-visual"'));
assert.equal(elementBlocks(html, { tag: 'article', className: 'capability-group' }).length, 12);
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node --test tests/dom.test.mjs tests/styles.test.mjs`

Expected: FAIL for the new visual and timeline contracts.

- [ ] **Step 3: Add the experience visual slot and emphasize the current role**

Add a landscape `<picture>` or `<img>` before the timeline with explicit dimensions. Preserve all company URLs, dates, titles, and bullet points. Give Thermo Fisher additional visual weight through layout and border treatment, not extra unsupported claims.

- [ ] **Step 4: Restyle capability groups**

Use a responsive two-column technical matrix with cyan group labels, low-contrast separators, and comfortable line height. At mobile widths, use one column; keep all text visible without JavaScript.

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tests/dom.test.mjs tests/styles.test.mjs`

```bash
git add index.html assets/css/styles.css tests/dom.test.mjs tests/styles.test.mjs
git commit -m "style: refine experience and engineering capability"
```

---

### Task 6: Redesign Projects, FAQs, And Contact Conclusion

**Files:**
- Modify: `index.html`
- Modify: `assets/js/render-projects.js`
- Modify: `assets/css/styles.css`
- Modify: `tests/dom.test.mjs`
- Modify: `tests/render-projects.test.mjs`
- Modify: `tests/styles.test.mjs`

- [ ] **Step 1: Write failing generated-markup and contact tests**

Require the generated project markup to use `.project-card` and preserve uncropped images and both links. Require a new `#contact` section with email, LinkedIn, GitHub, and resume destinations.

```js
assert.match(renderProject(project), /class="project project-card"/);
assert.match(renderProject(project), /loading="lazy"/);
assert.match(renderProject(project), />View Source<\/a>/);
assert.match(renderProject(project), />Explore Live<\/a>/);
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node --test tests/render-projects.test.mjs tests/dom.test.mjs tests/styles.test.mjs`

Expected: FAIL for the new card and contact contracts.

- [ ] **Step 3: Update safe project markup**

Add the `.project-card` class while preserving HTML escaping, protocol allowlisting, natural image dimensions, active filtering, numeric ordering, and unlimited project count.

- [ ] **Step 4: Add the cinematic contact section**

Create `#contact` after FAQs with a replaceable wide photograph, the heading `Let's build systems worth depending on`, a concise invitation, and explicit email, LinkedIn, GitHub, and resume actions. Keep the footer limited to copyright and back-to-top.

- [ ] **Step 5: Restyle projects and FAQs**

Use alternating project layouts on wide screens, natural-ratio images, clear text hierarchy, and illuminated text actions. Style native `<details>` elements with visible focus and plus/minus state while preserving browser semantics.

- [ ] **Step 6: Run focused tests and commit**

Run: `node --test tests/render-projects.test.mjs tests/dom.test.mjs tests/styles.test.mjs`

```bash
git add index.html assets/js/render-projects.js assets/css/styles.css tests/dom.test.mjs tests/render-projects.test.mjs tests/styles.test.mjs
git commit -m "feat: complete projects faq and contact experience"
```

---

### Task 7: Prepare Replaceable Professional Photography

**Files:**
- Create: `assets/images/experience-placeholder.webp`
- Create: `assets/images/contact-placeholder.webp`
- Modify: `index.html`
- Modify: `tests/assets.test.mjs`

- [ ] **Step 1: Write failing asset tests**

Require both placeholder files to be valid nontrivial WebP images and require explicit image dimensions in markup.

```js
for (const file of [
  'assets/images/experience-placeholder.webp',
  'assets/images/contact-placeholder.webp',
]) {
  const bytes = await readFile(file);
  assert.ok(bytes.length > 10_000, `${file} must be a nontrivial image`);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
}
```

- [ ] **Step 2: Run asset tests and confirm failure**

Run: `node --test tests/assets.test.mjs`

Expected: FAIL because the two photo assets do not exist.

- [ ] **Step 3: Produce temporary local photo assets**

Create optimized WebP variants from the existing user-provided portrait: one landscape crop for Experience and one wide crop for Contact. Keep the original hero image unchanged. Use descriptive filenames and target file sizes below 300 KB each.

- [ ] **Step 4: Wire explicit image dimensions and focal-position classes**

Use `width`, `height`, `loading="lazy"`, and `decoding="async"`. Assign separate classes so final professional photographs can define focal points without changing layout selectors.

- [ ] **Step 5: Run asset and link checks and commit**

Run: `node --test tests/assets.test.mjs`

Run: `npm run check:links`

```bash
git add assets/images/experience-placeholder.webp assets/images/contact-placeholder.webp index.html tests/assets.test.mjs
git commit -m "feat: add replaceable professional photo slots"
```

---

### Task 8: Complete Responsive, Accessibility, And Visual QA

**Files:**
- Modify: `assets/css/styles.css`
- Modify: `tests/visual.spec.mjs`
- Modify: `artifacts/portfolio-desktop.png`
- Modify: `artifacts/portfolio-mobile.png`
- Create: `design-qa.md`

- [ ] **Step 1: Extend visual tests before final polish**

Add viewport cases for `1440x900`, `1024x768`, `768x1024`, and `390x844`. At each viewport assert:

```js
assert.equal(await page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth), true);
assert.equal(await page.locator('main').isVisible(), true);
assert.equal(await page.locator('#systems .system-card').count(), 4);
assert.equal(await page.locator('#faqs details').count(), 4);
```

Retain response-failure and console-error collection. Add keyboard checks for navigation, case-study dialogs, FAQs, project actions, and contact actions.

- [ ] **Step 2: Run the full automated suite**

Run: `npm test`

Run: `npm run check:links`

Run: `npm run test:visual`

Run: `git diff --check`

Expected: all tests pass, all local assets resolve, no layout overflow occurs, and no whitespace errors are reported.

- [ ] **Step 3: Inspect desktop and mobile screenshots**

Review the four target viewports for blank canvases, illegible text, cropped portraits, overlapping metrics, layout shifts, inconsistent card heights, clipped dialog content, and weak focus states. Fix P0, P1, and P2 findings before continuing.

- [ ] **Step 4: Verify reduced motion and JavaScript fallback**

Use Playwright reduced-motion emulation and a JavaScript-disabled context. Confirm content remains visible, metrics show final values, projects retain the noscript fallback, and no essential control depends on animation.

- [ ] **Step 5: Save final captures and QA report**

Replace `artifacts/portfolio-desktop.png` and `artifacts/portfolio-mobile.png` with verified captures. Write `design-qa.md` with the source reference, tested viewports, interaction results, console/network results, resolved findings, any remaining P3 polish notes, and the exact line `final result: passed` only when every blocking check succeeds.

- [ ] **Step 6: Run the final verification suite**

Run: `npm test && npm run check:links && npm run test:visual && git diff --check`

Expected: zero failures.

- [ ] **Step 7: Commit the verified redesign**

```bash
git add assets/css/styles.css tests/visual.spec.mjs artifacts/portfolio-desktop.png artifacts/portfolio-mobile.png design-qa.md
git commit -m "test: verify cinematic portfolio redesign"
```

---

## Final Acceptance Criteria

- The site visually follows the approved Cinematic Dark direction without copying the reference site's identity or content.
- Every current portfolio section and verified factual claim remains available.
- Three professional photo locations can be replaced without changing layout code.
- Dynamic projects remain safe, ordered, status-filtered, and unlimited in count.
- Desktop and mobile layouts contain no overlap, clipping, or horizontal overflow.
- All essential content and controls work with reduced motion and degraded browser APIs.
- Unit, DOM, runtime, content, asset, link, canvas, and visual tests pass.
- `design-qa.md` exists and reports `final result: passed`.
