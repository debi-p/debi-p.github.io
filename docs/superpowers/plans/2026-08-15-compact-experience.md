# Compact Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fit the complete career history into a compact full-width experience section.

**Architecture:** Replace the split heading/timeline layout with a full-width heading and four compact chronological rows. Preserve semantic ordered-list markup and external company links while strengthening the Thermo Fisher content from the resumes.

**Tech Stack:** Semantic HTML, responsive CSS, Node test runner

---

### Task 1: Lock the approved content and layout contract

**Files:**
- Modify: `tests/dom.test.mjs`
- Modify: `tests/styles.test.mjs`

- [ ] Update the Experience visible-text snapshot with the five approved Thermo Fisher outcomes.
- [ ] Update stylesheet assertions to require a full-width experience heading and four compact timeline rows.
- [ ] Run `npm test` and confirm the new assertions fail before implementation.

### Task 2: Implement the compact experience grid

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`

- [ ] Add the approved Thermo Fisher outcomes without changing dates, roles, or company links.
- [ ] Make the heading full width and the timeline four compact chronological rows.
- [ ] Collapse the grid to one column on mobile.
- [ ] Run `npm test`, `npm run check:links`, and `git diff --check`.
