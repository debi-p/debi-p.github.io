# Hero Typography Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance the portfolio hero so Debi's identity is more prominent and the headline is concise, professional, and appropriately sized.

**Architecture:** Keep the existing semantic hero and responsive layout intact. Change the market-facing headline in HTML, define explicit desktop and mobile typography in the existing stylesheet, and update exact-copy plus visual assertions to protect the approved hierarchy.

**Tech Stack:** Static HTML5, CSS, Node.js test runner, Playwright visual tests

---

### Task 1: Protect The Approved Hero Copy And Hierarchy

**Files:**
- Modify: `tests/dom.test.mjs:120-140`
- Modify: `tests/styles.test.mjs`
- Modify: `tests/visual.spec.mjs:276-290`

- [ ] **Step 1: Update the exact-copy assertions**

Replace the old headline in the hero text snapshot and desktop visual assertion with:

```js
'I build intelligent platforms engineered for real-world scale.'
```

- [ ] **Step 2: Add typography hierarchy assertions**

Add a stylesheet test that requires the approved desktop declarations:

```js
test('gives the hero a restrained identity-led typography hierarchy', () => {
  assertDeclaration('h1', 'max-width', '760px');
  assertDeclaration('h1', 'font-size', '3.75rem');
  assertDeclaration('h1', 'line-height', '1.02');
  assertDeclaration('.hero-name', 'font-size', '1.5rem');
  assertDeclaration('.hero-content > .eyebrow', 'font-size', '0.875rem');
});
```

- [ ] **Step 3: Run the focused tests and confirm they fail**

Run:

```bash
node --test tests/dom.test.mjs tests/styles.test.mjs tests/visual.spec.mjs
```

Expected: FAIL because `index.html` and `styles.css` still contain the old copy and typography.

### Task 2: Implement The Refined Hero

**Files:**
- Modify: `index.html:76-80`
- Modify: `assets/css/styles.css:95-105`
- Modify: `assets/css/styles.css:262-286`
- Modify: `assets/css/styles.css:890-925`

- [ ] **Step 1: Replace the headline copy**

Set the hero heading to:

```html
<h1 id="hero-title">I build intelligent platforms engineered for real-world scale.</h1>
```

- [ ] **Step 2: Apply the desktop hierarchy**

Use fixed, restrained sizes and tighter spacing:

```css
h1 {
  width: 100%;
  max-width: 760px;
  margin: 14px 0 20px;
  font-size: 3.75rem;
  line-height: 1.02;
}

.hero-content {
  padding: 72px 0 64px;
  padding-right: min(560px, 43vw);
}

.hero-name {
  order: -1;
  margin: 0 0 12px;
  font-size: 1.5rem;
  font-weight: 850;
}

.hero-content > .eyebrow {
  font-size: 0.875rem;
}
```

- [ ] **Step 3: Apply the mobile hierarchy**

At the existing `max-width: 600px` breakpoint, use:

```css
h1 {
  font-size: 2.5rem;
}

.hero-name {
  font-size: 1.25rem;
}

.hero-content > .eyebrow {
  font-size: 0.75rem;
}
```

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run:

```bash
node --test tests/dom.test.mjs tests/styles.test.mjs tests/visual.spec.mjs
```

Expected: all focused tests pass.

### Task 3: Verify The Complete Portfolio

**Files:**
- Verify: `index.html`
- Verify: `assets/css/styles.css`

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm test
npm run check:links
```

Expected: all tests pass and all local assets resolve.

- [ ] **Step 2: Run Playwright visual checks**

Run:

```bash
npm run test:visual
```

Expected: desktop and mobile checks pass with no overflow, overlap, or hidden hero controls.

- [ ] **Step 3: Review desktop and mobile screenshots**

Confirm the name and role are clearly readable, the headline is subordinate to the overall composition, the system map does not overlap text, and primary actions remain in the first viewport.

- [ ] **Step 4: Commit the refinement**

```bash
git add index.html assets/css/styles.css tests/dom.test.mjs tests/styles.test.mjs tests/visual.spec.mjs docs/superpowers/plans/2026-08-14-hero-typography.md
git commit -m "Refine portfolio hero hierarchy"
```
