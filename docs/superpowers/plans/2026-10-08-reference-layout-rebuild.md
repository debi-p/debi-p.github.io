# Reference Layout Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recompose Debi Prasad Pradhan's portfolio around the approved reference layout while preserving all content, data hydration, accessibility, and static-hosting behavior.

**Architecture:** Keep the static HTML, CSS, and progressive JavaScript architecture. Change only presentation markup and styling contracts, retain all JavaScript hooks, and verify the new composition through semantic tests plus Chrome screenshots at desktop and mobile sizes.

**Tech Stack:** Semantic HTML, CSS, vanilla ES modules, Node test runner, Playwright.

---

### Task 1: Lock the approved semantic composition

**Files:**
- Modify: `tests/dom.test.mjs`
- Modify: `tests/styles.test.mjs`
- Modify: `tests/visual.spec.mjs`

- [ ] Add failing assertions for the named header identity, hero specialty pills, image-led system cards, compact capability disclosures, combined FAQ/contact layout, and rich footer.
- [ ] Run `npm test` and confirm the new contracts fail against the old page.

### Task 2: Recompose the static document

**Files:**
- Modify: `index.html`

- [ ] Reorder and regroup existing content into the approved eight-section composition.
- [ ] Preserve every enterprise case-study trigger, experience fact, capability phrase, project fallback, FAQ answer, contact URL, resume URL, impact metric, canvas hook, and no-JavaScript fallback.
- [ ] Run `npm test` and keep markup contracts green.

### Task 3: Implement responsive reference pacing

**Files:**
- Modify: `assets/css/styles.css`

- [ ] Build the constrained header, 40/60 hero, proof columns, pills, two-column system cards, photographic experience section, editorial project rows, compact skills, FAQ/contact split, and richer footer without gradients or nested cards.
- [ ] Stack all primary regions at mobile breakpoints and retain visible focus, reduced-motion, and no-JavaScript behavior.
- [ ] Run `npm test` and fix contract failures.

### Task 4: Verify and document

**Files:**
- Modify: `design-qa.md`

- [ ] Run `npm test`.
- [ ] Run `npm run check:links`.
- [ ] Start the static server and run the system Chrome visual suite with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.
- [ ] Inspect `artifacts/portfolio-desktop.png` and `artifacts/portfolio-mobile.png` for composition, image cropping, overflow, and text overlap.
- [ ] Run `git diff --check` and update `design-qa.md` with observed results only.
- [ ] Commit all cohesive changes with `feat: align portfolio with reference layout pattern` and do not push.
