# Exact Reference Pattern Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio to closely match the approved reference site's page pattern, exact core palette, image proportions, responsive sequence, and interaction style while using Debi's content and local temporary images.

**Architecture:** Keep the site as a static GitHub Pages application. Replace the current dashboard-like composition in `index.html` and `assets/css/styles.css`, retain the JSON project renderer and accessible case-study dialog, simplify `assets/js/main.js`, and remove the disconnected canvas/metric enhancements after tests prove they are unused.

**Tech Stack:** Semantic HTML5, CSS Grid/Flexbox, vanilla JavaScript, Node test runner, Playwright visual verification, Python static server.

---

## File Map

- `index.html`: reference-matched page structure and approved portfolio content.
- `assets/css/styles.css`: exact palette, layout, responsive behavior, interactions, and accessibility states.
- `assets/js/main.js`: navigation, reveal, dialog, footer year, and isolated initialization.
- `assets/js/render-projects.js`: preserve active-project sorting and editorial card output.
- `assets/js/content.js`: preserve the four case-study records.
- `assets/js/system-map.js`: remove after all imports and tests are deleted.
- `assets/js/impact-metrics.js`: remove after all imports and tests are deleted.
- `assets/images/*`: reuse current images as replaceable local samples.
- `tests/dom.test.mjs`: enforce the new section hierarchy and removed canvas.
- `tests/styles.test.mjs`: enforce exact colors and responsive contracts.
- `tests/content.test.mjs`: preserve approved system claims.
- `tests/main.test.mjs`: enforce simplified enhancement entry points.
- `tests/main-runtime.test.mjs`: verify resilient navigation/dialog/project behavior.
- `tests/render-projects.test.mjs`: verify reference-style project cards.
- `tests/visual.spec.mjs`: desktop/mobile visual and interaction verification.
- `tests/system-map.test.mjs`: delete.
- `tests/impact-metrics.test.mjs`: delete.
- `design-qa.md`: final evidence-backed QA report.

### Task 1: Lock The Reference Structure With Failing Tests

**Files:**
- Modify: `tests/dom.test.mjs`
- Modify: `tests/styles.test.mjs`
- Modify: `tests/main.test.mjs`
- Modify: `tests/render-projects.test.mjs`

- [ ] **Step 1: Replace old structural assertions**

Assert that the document contains, in order, `header`, hero, `#systems`, `#experience`, `#projects`, `#faqs`, `#contact`, and footer. Assert that `#system-map`, `.achievement-orbit`, and the separate impact band do not exist.

```js
assert.doesNotMatch(html, /id="system-map"|achievement-orbit|hero-impact/);
assert.match(html, /class="hero[^"]*"/);
assert.ok(html.indexOf('id="systems"') < html.indexOf('id="experience"'));
assert.ok(html.indexOf('id="experience"') < html.indexOf('id="projects"'));
```

- [ ] **Step 2: Add exact palette assertions**

```js
for (const color of ['#0a1628', '#0a2f4d', '#1e9aa2', '#22d3ee', '#ffffff']) {
  assert.match(css.toLowerCase(), new RegExp(color));
}
```

- [ ] **Step 3: Assert editorial project markup**

Verify rendered projects retain plain titles, summaries, local images, View Source, and Explore Live links without numbering.

- [ ] **Step 4: Run focused tests and confirm failure**

Run: `node --test tests/dom.test.mjs tests/styles.test.mjs tests/main.test.mjs tests/render-projects.test.mjs`

Expected: FAIL because the existing canvas/impact composition and old CSS contracts remain.

- [ ] **Step 5: Commit the failing contracts**

```bash
git add tests/dom.test.mjs tests/styles.test.mjs tests/main.test.mjs tests/render-projects.test.mjs
git commit -m "test: define exact reference portfolio pattern"
```

### Task 2: Rebuild The Semantic Page Structure

**Files:**
- Modify: `index.html`
- Test: `tests/dom.test.mjs`
- Test: `tests/content.test.mjs`

- [ ] **Step 1: Replace the header and hero markup**

Create the identity lockup, compact navigation, image-led hero, three proof facts, four signature capabilities, and resume actions. Use `assets/images/debi-prasad-profile.webp` as the initial hero sample.

- [ ] **Step 2: Replace the systems section**

Render exactly four image-led system cards with the approved names and facts. Retain `data-case-study` triggers for the existing accessible dialog.

- [ ] **Step 3: Rebuild experience and capability markup**

Pair `assets/images/experience-placeholder.webp` with the four-company progression and compact capability groups.

- [ ] **Step 4: Rebuild projects, FAQ/contact, and footer shells**

Keep `#project-list` for JSON hydration, four `<details>` FAQ items, the contact panel, and footer links. Do not add testimonials, publications, videos, or any new section.

- [ ] **Step 5: Run semantic/content tests**

Run: `node --test tests/dom.test.mjs tests/content.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit markup**

```bash
git add index.html tests/dom.test.mjs tests/content.test.mjs
git commit -m "feat: rebuild portfolio in reference page structure"
```

### Task 3: Implement The Exact Visual System

**Files:**
- Modify: `assets/css/styles.css`
- Test: `tests/styles.test.mjs`

- [ ] **Step 1: Replace the design tokens**

Define the approved core tokens and Geist-style system stack.

```css
:root {
  --navy: #0a1628;
  --blue: #0a2f4d;
  --teal: #1e9aa2;
  --cyan: #22d3ee;
  --white: #ffffff;
  --muted: #6b7280;
  --font-sans: "Geist", "Inter", system-ui, sans-serif;
}
```

- [ ] **Step 2: Implement reference-matched desktop layouts**

Style the sticky header, 42/58 hero, two-column system cards, image-led experience, three-column editorial projects, FAQ/contact split, and three-column footer. Keep radii at 8px or less.

- [ ] **Step 3: Implement mobile layouts**

At `760px` and below, stack all content in source order, expose the menu control, use full-width media, and maintain 44px targets with no horizontal overflow.

- [ ] **Step 4: Implement interaction and accessibility states**

Add keyboard focus rings, hover states, open FAQ states, dialog styling, reduced-motion behavior, and no-JavaScript visibility.

- [ ] **Step 5: Run style tests**

Run: `node --test tests/styles.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit visual system**

```bash
git add assets/css/styles.css tests/styles.test.mjs
git commit -m "feat: apply exact navy teal reference visual system"
```

### Task 4: Simplify Enhancements And Remove Obsolete Visualizations

**Files:**
- Modify: `assets/js/main.js`
- Modify: `assets/js/render-projects.js`
- Modify: `tests/main.test.mjs`
- Modify: `tests/main-runtime.test.mjs`
- Modify: `tests/render-projects.test.mjs`
- Delete: `assets/js/system-map.js`
- Delete: `assets/js/impact-metrics.js`
- Delete: `tests/system-map.test.mjs`
- Delete: `tests/impact-metrics.test.mjs`

- [ ] **Step 1: Remove failing obsolete-enhancement expectations**

Delete tests for particle geometry, canvas lifecycle, and animated impact values. Add assertions that project, navigation, reveal, dialog, and footer initializers remain isolated.

- [ ] **Step 2: Run runtime tests and confirm failure**

Run: `node --test tests/main.test.mjs tests/main-runtime.test.mjs tests/render-projects.test.mjs`

Expected: FAIL until obsolete imports and rendering markup are removed.

- [ ] **Step 3: Remove obsolete imports and modules**

Delete all system-map and impact-metric imports, initialization calls, files, and cleanup logic. Preserve fail-safe initialization for the remaining enhancements.

- [ ] **Step 4: Restyle project renderer output**

Emit image-led editorial articles with title, summary, View Source, and Explore Live while retaining URL sanitization, active filtering, and numeric ordering.

- [ ] **Step 5: Run runtime and project tests**

Run: `node --test tests/main.test.mjs tests/main-runtime.test.mjs tests/render-projects.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit JavaScript simplification**

```bash
git add assets/js tests
git commit -m "refactor: remove obsolete portfolio visualizations"
```

### Task 5: Visual Verification And Final QA

**Files:**
- Modify: `tests/visual.spec.mjs`
- Modify: `design-qa.md`
- Modify: `README.md` only if the run instructions changed

- [ ] **Step 1: Update visual tests**

Verify desktop at 1440px and mobile at 390px. Assert the hero image is visible, all four system cards render, project links work, FAQ opens, dialog opens/closes, menu remains usable, no horizontal overflow occurs, and the removed canvas is absent.

- [ ] **Step 2: Run the complete unit suite**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 3: Check local assets**

Run: `npm run check:links`

Expected: all local links and assets resolve.

- [ ] **Step 4: Run visual tests**

Run: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:visual`

Expected: desktop, mobile, reduced-motion, no-JavaScript, interaction, and accessibility checks pass.

- [ ] **Step 5: Inspect screenshots and update QA**

Inspect `artifacts/portfolio-desktop.png` and `artifacts/portfolio-mobile.png`. Record source comparison, overflow, typography, media crop, interaction, and accessibility results in `design-qa.md`; set `final result: passed` only after all P0-P2 findings are fixed.

- [ ] **Step 6: Run final repository checks**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intended changes remain.

- [ ] **Step 7: Commit final verification changes**

```bash
git add tests/visual.spec.mjs design-qa.md README.md
git commit -m "test: verify exact reference portfolio rebuild"
```
