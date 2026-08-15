# Portfolio V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready static portfolio that positions Debi Prasad Pradhan as a Staff Software Engineer specializing in AI platforms and distributed systems.

**Architecture:** Use semantic HTML, one focused stylesheet, structured JavaScript content, progressively enhanced interactions, and an isolated canvas renderer. A Node-based test suite validates public-content safety, static HTML contracts, rendering helpers, reduced-motion behavior, and local asset links before Playwright verifies the final desktop and mobile DOM experience.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Node.js built-in test runner, Playwright from the bundled workspace runtime, GitHub Pages.

---

## File Map

- `index.html`: semantic page structure, metadata, navigation, content landmarks, dialog shell, and no-JavaScript fallback.
- `assets/css/styles.css`: tokens, typography, responsive layout, components, focus states, and reduced-motion rules.
- `assets/js/content.js`: public-safe enterprise case studies and curated personal-project records.
- `assets/js/render-projects.js`: pure project markup generation and optional-link handling.
- `assets/js/main.js`: mobile navigation, case-study dialogs, project hydration, reveal behavior, and current year.
- `assets/js/system-map.js`: hero canvas lifecycle, drawing, pointer response, viewport pause, and motion preference handling.
- `assets/resume/Debi_Prasad.pdf`: primary AI Platform resume.
- `assets/resume/debi_prasad_resume.pdf`: secondary Architecture resume.
- `assets/images/social-preview.png`: static social-sharing image derived from the visual identity.
- `assets/images/favicon.svg`: DP monogram favicon.
- `tests/content.test.mjs`: case-study/project schema, confidentiality, claims, and curation tests.
- `tests/render-projects.test.mjs`: project rendering and optional action tests.
- `tests/dom.test.mjs`: semantic structure, metadata, anchors, dialogs, and asset-link tests.
- `tests/system-map.test.mjs`: canvas initialization and reduced-motion lifecycle tests.
- `tests/visual.spec.mjs`: Playwright desktop/mobile behavior and screenshot assertions.
- `tests/helpers/playwright.mjs`: resolves Playwright from a standard install or an explicitly supplied bundled module URL.
- `scripts/check-local-links.mjs`: verifies every local HTML asset target exists.
- `scripts/capture-social-preview.mjs`: captures the 1200x630 hero social image from the local site.
- `package.json`: deterministic local test and static-server scripts without frontend runtime dependencies.
- `README.md`: local preview, test, deployment, and project-curation instructions.

### Task 1: Establish the Content Safety Contract

**Files:**
- Create: `package.json`
- Create: `assets/js/content.js`
- Create: `tests/content.test.mjs`

- [ ] **Step 1: Create the minimal package scripts**

```json
{
  "name": "debi-prasad-portfolio",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "test:visual": "node --test tests/visual.spec.mjs",
    "serve": "python3 -m http.server 4173"
  },
  "devDependencies": {
    "playwright": "^1.61.1"
  }
}
```

- [ ] **Step 2: Write the failing content-contract tests**

Create `tests/content.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { caseStudies, personalProjects } from "../assets/js/content.js";

const forbiddenPublicText = [
  "thermofisher.atlassian.net",
  "jira",
  "confluence",
  "revenera",
  "flexera",
  "workflow forge",
  "pywizard",
  "dfp",
  "signed url",
  "bucket"
];

test("publishes four complete enterprise case studies", () => {
  assert.equal(caseStudies.length, 4);
  for (const study of caseStudies) {
    assert.match(study.id, /^[a-z0-9-]+$/);
    assert.ok(study.name.length > 3);
    assert.ok(study.summary.length > 30);
    assert.ok(study.problem.length > 30);
    assert.ok(study.role.length > 30);
    assert.ok(study.approach.length >= 3);
    assert.ok(study.outcomes.length >= 1);
    assert.ok(study.technologies.length >= 3);
  }
});

test("keeps internal names and locations out of public content", () => {
  const publicText = JSON.stringify({ caseStudies, personalProjects }).toLowerCase();
  for (const forbidden of forbiddenPublicText) {
    assert.equal(publicText.includes(forbidden), false, `Found forbidden text: ${forbidden}`);
  }
});

test("qualifies the 1 TB target and preserves the verified 400 GB result", () => {
  const releaseGrid = caseStudies.find(({ id }) => id === "releasegrid");
  const text = JSON.stringify(releaseGrid);
  assert.match(text, /400 GB/);
  assert.match(text, /1 TB support in progress/);
});

test("shows only original ready personal projects", () => {
  for (const project of personalProjects) {
    assert.equal(project.original, true);
    assert.equal(project.ready, true);
    assert.match(project.sourceUrl, /^https:\/\/github\.com\/debi-p\//);
    assert.ok(project.stack.length >= 1);
  }
});
```

- [ ] **Step 3: Run the contract tests to verify they fail**

Run: `node --test tests/content.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `assets/js/content.js`.

- [ ] **Step 4: Implement structured public content**

Create `assets/js/content.js` exporting:

```js
export const caseStudies = [
  {
    id: "specflow-ai",
    name: "SpecFlow AI",
    category: "AI-native engineering orchestration",
    summary: "A specification-driven delivery platform that coordinates planning, implementation, review, and traceability across the software lifecycle.",
    metric: "67% less SDLC effort · 3x delivery acceleration",
    problem: "Complex enterprise delivery required repeated manual translation between requirements, design, implementation, and validation, slowing teams and weakening traceability.",
    role: "Partnered with senior architects and led technical execution across teams, shaping the orchestration model, reusable platform components, and production engineering practices.",
    approach: [
      "Used durable workflow orchestration to coordinate long-running engineering stages.",
      "Connected planning and source-control systems through traceable workflow contracts.",
      "Added human review and governance around AI-generated engineering artifacts."
    ],
    outcomes: ["Reduced SDLC effort by 67%", "Accelerated delivery by 3x"],
    technologies: ["Temporal", "Python", "Java", "LLM APIs", "GitHub Actions"]
  },
  {
    id: "scilens",
    name: "SciLens",
    category: "Multi-agent scientific intelligence",
    summary: "A governed AI assistant for interpreting scientific literature, extracting evidence, and preparing expert-reviewable outputs.",
    metric: "Model preparation reduced from weeks to hours",
    problem: "Scientific teams needed to transform large volumes of specialist literature into reliable, reviewable evidence without losing provenance or domain oversight.",
    role: "Designed platform capabilities and guided implementation of agent orchestration, model integration, observability, validation, and human review workflows.",
    approach: [
      "Coordinated specialized agents through explicit graph-based workflows.",
      "Preserved evidence provenance and inserted human approval at critical decisions.",
      "Instrumented model behavior to support evaluation, debugging, and operational trust."
    ],
    outcomes: ["Reduced model-preparation work from weeks to hours"],
    technologies: ["LangGraph", "OpenAI", "Claude", "Gemini", "Langfuse"]
  },
  {
    id: "evidencegraph",
    name: "EvidenceGraph",
    category: "Enterprise scientific knowledge platform",
    summary: "A graph-powered data platform connecting scientific entities, experimental evidence, semantic search, and AI retrieval.",
    metric: "Graph + semantic retrieval foundation",
    problem: "Scientific information was distributed across heterogeneous sources and formats, limiting discovery, relationship analysis, and reliable retrieval for intelligent applications.",
    role: "Architected platform capabilities for data ingestion, semantic enrichment, graph relationships, asynchronous processing, and downstream AI retrieval.",
    approach: [
      "Built repeatable ingestion and transformation flows for heterogeneous scientific data.",
      "Modeled domain relationships in a knowledge graph and enriched them with semantic representations.",
      "Decoupled ingestion and indexing through asynchronous messaging."
    ],
    outcomes: ["Created a reusable foundation for semantic search and retrieval-augmented AI"],
    technologies: ["GraphDB", "Apache NiFi", "RabbitMQ", "Python", "SBERT"]
  },
  {
    id: "releasegrid",
    name: "ReleaseGrid",
    category: "Secure enterprise software distribution",
    summary: "A resilient platform for publishing, governing, discovering, and delivering large enterprise software assets.",
    metric: "400 GB validated · 1 TB support in progress",
    problem: "Enterprise software distribution required secure large-file delivery, product and catalog governance, controlled access, search, and reliable processing at scale.",
    role: "Co-designed the technical architecture with Solution Architects and led implementation across multiple engineering teams, translating the target architecture into production-ready services and engineering standards.",
    approach: [
      "Used resilient multipart transfer flows for large software assets.",
      "Separated metadata, storage, search, and downstream processing through service boundaries and asynchronous events.",
      "Standardized API, testing, security, observability, and deployment practices across platform components."
    ],
    outcomes: ["Validated reliable file distribution up to 400 GB", "Architecture evolving toward 1 TB support"],
    technologies: ["Java", "AWS", "Kubernetes", "RabbitMQ", "Search indexing"]
  }
];

export const personalProjects = [
  {
    id: "brainy-blocks",
    title: "Brainy Blocks",
    category: "Interactive learning",
    summary: "A browser-based collection of coding, logic, language, and visual activities designed for young learners.",
    contribution: "Designed and implemented the activity hub and its interactive puzzle experiences.",
    stack: ["JavaScript", "HTML", "CSS"],
    status: "Active build",
    sourceUrl: "https://github.com/debi-p/kids-puzzle",
    liveUrl: "",
    original: true,
    ready: true,
    featured: true
  }
];
```

- [ ] **Step 5: Run tests and verify the content contract passes**

Run: `node --test tests/content.test.mjs`

Expected: 4 tests pass, 0 fail.

- [ ] **Step 6: Commit the content contract**

```bash
git add package.json assets/js/content.js tests/content.test.mjs
git commit -m "Add public portfolio content model"
```

### Task 2: Build the Semantic Page and Asset-Link Guard

**Files:**
- Replace: `index.html`
- Create: `scripts/check-local-links.mjs`
- Create: `tests/dom.test.mjs`

- [ ] **Step 1: Write failing DOM and local-link tests**

Create `tests/dom.test.mjs` using deterministic static-HTML contracts:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const count = (pattern) => (html.match(pattern) || []).length;
const has = (pattern, message) => assert.match(html, pattern, message);

test("uses the approved identity and one primary h1", () => {
  assert.equal(count(/<h1\b/g), 1);
  has(/<h1[^>]*>I build intelligent systems that survive the real world\.<\/h1>/i);
  has(/<title>Debi Prasad Pradhan \| Staff Software Engineer, AI Platforms<\/title>/i);
});

test("provides required landmarks and navigation targets", () => {
  for (const tag of ["header", "nav", "main", "footer"]) {
    has(new RegExp(`<${tag}\\b`, "i"), `Missing ${tag}`);
  }
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const id of ["top", "impact", "systems", "projects", "experience", "resume", "contact"]) {
    assert.ok(ids.has(id), `Missing #${id}`);
  }
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(target), `Broken anchor #${target}`);
  }
});

test("includes SEO, canonical, and social metadata", () => {
  has(/<link rel="canonical" href="https:\/\/debi-p\.github\.io\/">/);
  has(/<meta name="description" content="[^"]+">/);
  has(/<meta property="og:image" content="https:\/\/debi-p\.github\.io\/assets\/images\/social-preview\.png">/);
  has(/<script type="application\/ld\+json">/);
});

test("includes accessible controls and dialog shell", () => {
  has(/<button[^>]+aria-controls="site-navigation"[^>]*>/);
  has(/<dialog[^>]+aria-labelledby="case-study-title"[^>]*>/);
  has(/<a class="skip-link" href="#main-content">/);
});
```

Create `scripts/check-local-links.mjs`:

```js
import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const html = await readFile(path.join(root, "index.html"), "utf8");
const urls = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((url) => url && !url.startsWith("#") && !/^(https?:|mailto:|data:)/.test(url));

const missing = [];
for (const url of new Set(urls)) {
  try {
    await access(path.join(root, decodeURIComponent(url.split(/[?#]/)[0])));
  } catch {
    missing.push(url);
  }
}

if (missing.length) {
  console.error(`Missing local assets:\n${missing.join("\n")}`);
  process.exit(1);
}
console.log(`Checked ${new Set(urls).size} local asset links.`);
```

Replace the `scripts` object in `package.json` with:

```json
"scripts": {
  "test": "node --test tests/*.test.mjs",
  "test:visual": "node --test tests/visual.spec.mjs",
  "check:links": "node scripts/check-local-links.mjs",
  "serve": "python3 -m http.server 4173"
}
```

- [ ] **Step 2: Run the DOM test to verify it fails against the sample page**

Run:

```bash
node --test tests/dom.test.mjs
```

Expected: FAIL because the approved landmarks, canonical metadata, and dialog are absent.

- [ ] **Step 3: Replace `index.html` with the approved semantic structure**

Use this exact body structure and copy. The four system rows intentionally omit dialog buttons until Task 5 so the interaction contract fails before it is implemented:

```html
<body id="top">
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="site-header">
    <nav class="content-shell" aria-label="Primary navigation">
      <a class="brand" href="#top" aria-label="Debi Prasad Pradhan, home">DP</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" aria-label="Open navigation">
        <span></span><span></span>
      </button>
      <div id="site-navigation" class="nav-links">
        <a href="#impact">Impact</a>
        <a href="#systems">Systems</a>
        <a href="#projects">Projects</a>
        <a href="#experience">Experience</a>
        <a href="#resume">Resume</a>
        <a class="nav-contact" href="#contact">Contact</a>
      </div>
    </nav>
  </header>
  <main id="main-content">
    <section class="hero" aria-labelledby="hero-title">
      <canvas id="system-map" class="system-map" aria-hidden="true"></canvas>
      <div class="content-shell hero-content">
        <p class="eyebrow">Staff Software Engineer · AI Platforms &amp; Distributed Systems</p>
        <p class="hero-name">Debi Prasad Pradhan</p>
        <h1 id="hero-title">I build intelligent systems that survive the real world.</h1>
        <p class="hero-summary">11+ years turning complex enterprise problems into secure, scalable platforms, while leading teams from architecture through production.</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#systems">Explore selected systems</a>
          <a class="button button-secondary" href="assets/resume/Debi_Prasad.pdf" download>Download AI Platform Resume</a>
        </div>
        <div class="social-links" aria-label="Professional profiles">
          <a href="https://www.linkedin.com/in/debiprasadpradhan" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://github.com/debi-p" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </section>
    <section id="impact" class="impact-band" aria-label="Selected impact">
      <div class="content-shell impact-grid">
        <div><strong>67%</strong><span>less SDLC effort</span></div>
        <div><strong>3x</strong><span>delivery acceleration</span></div>
        <div><strong>20+</strong><span>engineers across three teams</span></div>
        <div><strong>400 GB</strong><span>file distribution validated</span></div>
      </div>
    </section>
    <section id="systems" class="section systems" aria-labelledby="systems-title">
      <div class="content-shell">
        <div class="section-heading"><p class="eyebrow">Selected enterprise systems</p><h2 id="systems-title">Evidence before adjectives.</h2><p>Four systems that show how architecture, AI, and engineering leadership become measurable outcomes.</p></div>
        <div class="system-list">
          <article class="system-row" data-reveal><p class="system-index">01 / AI orchestration</p><div><h3>SpecFlow AI</h3><p>A specification-driven delivery platform coordinating planning, implementation, review, and traceability.</p></div><strong>67% less effort · 3x faster</strong></article>
          <article class="system-row" data-reveal><p class="system-index">02 / Scientific intelligence</p><div><h3>SciLens</h3><p>Governed multi-agent intelligence with evidence provenance, evaluation, and human review.</p></div><strong>Weeks to hours</strong></article>
          <article class="system-row" data-reveal><p class="system-index">03 / Knowledge platform</p><div><h3>EvidenceGraph</h3><p>Graph relationships, semantic retrieval, and asynchronous data processing for scientific discovery.</p></div><strong>Graph + semantic retrieval</strong></article>
          <article class="system-row" data-reveal><p class="system-index">04 / Software distribution</p><div><h3>ReleaseGrid</h3><p>Secure publishing and resilient delivery for large enterprise software assets.</p></div><strong>400 GB validated · 1 TB support in progress</strong></article>
        </div>
      </div>
    </section>
    <section id="projects" class="section projects" aria-labelledby="projects-title">
      <div class="content-shell"><div class="section-heading"><p class="eyebrow">Independent builds</p><h2 id="projects-title">Curiosity becomes software.</h2><p>A curated collection of original tools and useful experiments built outside enterprise constraints.</p></div><div id="project-list" class="project-list" aria-live="polite"></div><a class="text-link" href="https://github.com/debi-p?tab=repositories" target="_blank" rel="noreferrer">View all GitHub repositories <span aria-hidden="true">↗</span></a></div>
    </section>
    <section id="expertise" class="section expertise" aria-labelledby="expertise-title">
      <div class="content-shell"><div class="section-heading"><p class="eyebrow">Operating range</p><h2 id="expertise-title">From model behavior to platform behavior.</h2></div><div class="expertise-grid">
        <article><span>01</span><h3>AI Platform Engineering</h3><p>Agent orchestration, retrieval, evaluation, observability, provenance, and human oversight.</p></article>
        <article><span>02</span><h3>Distributed Systems</h3><p>Service boundaries, events, durable workflows, APIs, scalability, and fault-aware design.</p></article>
        <article><span>03</span><h3>Cloud &amp; Reliability</h3><p>AWS, Kubernetes, containers, data platforms, performance, security, and cost discipline.</p></article>
        <article><span>04</span><h3>Technical Leadership</h3><p>Architecture governance, engineering standards, cross-team execution, and mentoring.</p></article>
      </div></div>
    </section>
    <section id="experience" class="section experience" aria-labelledby="experience-title">
      <div class="content-shell experience-layout"><div class="section-heading"><p class="eyebrow">Experience</p><h2 id="experience-title">A progression from implementation to organizational influence.</h2></div><ol class="timeline">
        <li data-reveal><div><time datetime="2022-04">2022 — Present</time><h3>Staff Software Engineer / Technical Architect</h3><p>Thermo Fisher Scientific</p></div><p>Partnering with senior architects and leading implementation across three engineering teams for AI-native and cloud-scale enterprise platforms.</p></li>
        <li data-reveal><div><time datetime="2019">2019 — 2022</time><h3>Applications Engineer</h3><p>Oracle</p></div><p>Modernized enterprise user experiences and delivered APIs supporting global ERP workflows.</p></li>
        <li data-reveal><div><time datetime="2017">2017 — 2019</time><h3>Software Engineer</h3><p>ComakeIT</p></div><p>Built Spring Boot microservices and strengthened delivery through automated testing.</p></li>
        <li data-reveal><div><time datetime="2015">2015 — 2017</time><h3>Software Engineer</h3><p>HCL Technologies</p></div><p>Developed Java services and multithreaded data-processing capabilities.</p></li>
      </ol></div>
    </section>
    <section id="resume" class="section resume" aria-labelledby="resume-title">
      <div class="content-shell"><div class="section-heading"><p class="eyebrow">Resume</p><h2 id="resume-title">Choose the lens most useful to you.</h2></div><div class="resume-grid">
        <article><p class="eyebrow">Primary</p><h3>AI Platform Resume</h3><p>AI platforms, distributed systems, cloud engineering, and Staff-level technical leadership.</p><div class="resume-actions"><a class="button button-primary" href="assets/resume/Debi_Prasad.pdf" target="_blank">Open resume</a><a href="assets/resume/Debi_Prasad.pdf" download>Download PDF</a></div></article>
        <article><p class="eyebrow">Alternate</p><h3>Architecture Resume</h3><p>Enterprise architecture, platform modernization, governance, and cross-team execution.</p><div class="resume-actions"><a class="button button-secondary" href="assets/resume/debi_prasad_resume.pdf" target="_blank">Open resume</a><a href="assets/resume/debi_prasad_resume.pdf" download>Download PDF</a></div></article>
      </div></div>
    </section>
    <section id="contact" class="contact" aria-labelledby="contact-title">
      <div class="content-shell contact-layout"><div><p class="eyebrow">Bengaluru · India and global opportunities</p><h2 id="contact-title">Let’s build systems worth depending on.</h2></div><div class="contact-actions"><a class="button button-primary" href="mailto:dpp2017@gmail.com">Start a conversation</a><a href="https://www.linkedin.com/in/debiprasadpradhan" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></div></div>
    </section>
  </main>
  <footer><div class="content-shell"><p>© <span data-current-year>2026</span> Debi Prasad Pradhan</p><a href="#top">Back to top <span aria-hidden="true">↑</span></a></div></footer>
  <dialog id="case-study-dialog" aria-labelledby="case-study-title">
    <div class="dialog-panel"><button class="dialog-close" type="button" aria-label="Close case study">×</button><p id="case-study-category" class="eyebrow"></p><h2 id="case-study-title"></h2><p id="case-study-metric" class="dialog-metric"></p><div class="dialog-section"><h3>The problem</h3><p id="case-study-problem"></p></div><div class="dialog-section"><h3>My role</h3><p id="case-study-role"></p></div><div class="dialog-section"><h3>Architecture approach</h3><ul id="case-study-approach"></ul></div><div class="dialog-section"><h3>Outcomes</h3><ul id="case-study-outcomes"></ul></div><ul id="case-study-technologies" class="technology-list" aria-label="Technologies"></ul></div>
  </dialog>
  <script type="module" src="assets/js/main.js"></script>
</body>
```

The head must include:

```html
<title>Debi Prasad Pradhan | Staff Software Engineer, AI Platforms</title>
<meta name="description" content="Staff Software Engineer with 11+ years building enterprise AI platforms, distributed systems, and cloud-native products.">
<link rel="canonical" href="https://debi-p.github.io/">
<meta property="og:title" content="Debi Prasad Pradhan | Staff Software Engineer">
<meta property="og:description" content="AI platforms, distributed systems, and engineering leadership grounded in measurable impact.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://debi-p.github.io/">
<meta property="og:image" content="https://debi-p.github.io/assets/images/social-preview.png">
<link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/css/styles.css">
```

The JSON-LD must identify Debi as a Person in Bengaluru and link only to the public LinkedIn and GitHub profiles.

Use this exact JSON-LD payload:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Debi Prasad Pradhan",
  "jobTitle": "Staff Software Engineer",
  "address": { "@type": "PostalAddress", "addressLocality": "Bengaluru", "addressCountry": "IN" },
  "url": "https://debi-p.github.io/",
  "sameAs": ["https://github.com/debi-p", "https://www.linkedin.com/in/debiprasadpradhan"]
}
</script>
```

- [ ] **Step 4: Run DOM tests and inspect remaining expected failures**

Run:

```bash
node --test tests/dom.test.mjs
```

Expected: all 4 DOM tests pass.

- [ ] **Step 5: Run the local-link checker and verify asset failures are explicit**

Run:

```bash
node scripts/check-local-links.mjs
```

Expected: FAIL listing stylesheet, scripts, images, and resume assets that are introduced in later tasks.

- [ ] **Step 6: Commit the semantic shell and guard**

```bash
git add index.html package.json scripts/check-local-links.mjs tests/dom.test.mjs
git commit -m "Build semantic portfolio page shell"
```

### Task 3: Implement the Executive Editorial Visual System

**Files:**
- Create: `assets/css/styles.css`
- Modify: `index.html`

- [ ] **Step 1: Add the visual tokens and global rules**

Use these exact token categories in `assets/css/styles.css`:

```css
:root {
  --canvas: #f2f0e9;
  --paper: #fbfaf6;
  --ink: #15191b;
  --ink-soft: #59635f;
  --surface-dark: #121a1b;
  --surface-dark-soft: #1d2928;
  --teal: #08705e;
  --teal-bright: #6ce1bf;
  --mint: #d9f2e9;
  --gold: #c49a2f;
  --rule: rgba(21, 25, 27, 0.17);
  --rule-light: rgba(255, 255, 255, 0.15);
  --radius: 6px;
  --content: 1180px;
  --header-height: 72px;
}
```

Implement:

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-padding-top: var(--header-height); }
body { margin: 0; overflow-x: clip; background: var(--canvas); color: var(--ink); font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; }
body:has(dialog[open]) { overflow: hidden; }
a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: 0.22em; }
button { color: inherit; font: inherit; }
canvas { display: block; }
:focus-visible { outline: 3px solid var(--gold); outline-offset: 4px; }
.skip-link { position: fixed; left: 20px; top: -80px; z-index: 100; padding: 10px 14px; background: var(--ink); color: white; }
.skip-link:focus { top: 12px; }
.content-shell { width: min(var(--content), calc(100% - 40px)); margin-inline: auto; }
.eyebrow { margin: 0; color: var(--teal); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
h1, h2, h3, p { letter-spacing: 0; }
h1, h2, h3 { text-wrap: balance; }
h1 { margin: 16px 0 22px; max-width: 920px; font-size: 5rem; line-height: 0.98; }
h2 { margin: 8px 0 16px; font-size: 2.7rem; line-height: 1.08; }
h3 { line-height: 1.2; }
.section-heading { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr); gap: 24px 56px; margin-bottom: 56px; }
.section-heading .eyebrow { grid-column: 1 / -1; }
.section-heading h2, .section-heading > p:last-child { margin: 0; }
.section-heading > p:last-child { max-width: 55ch; color: var(--ink-soft); }
.button { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; padding: 10px 16px; border: 1px solid var(--ink); border-radius: var(--radius); font-weight: 800; text-decoration: none; }
.button-primary { background: var(--ink); color: white; }
.button-secondary { background: transparent; color: var(--ink); }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
```

- [ ] **Step 2: Implement desktop layouts**

Add these desktop layouts:

```css
.site-header { position: sticky; top: 0; z-index: 30; min-height: var(--header-height); border-bottom: 1px solid transparent; background: color-mix(in srgb, var(--canvas) 90%, transparent); backdrop-filter: blur(14px); }
.site-header nav { min-height: var(--header-height); display: flex; align-items: center; justify-content: space-between; }
.brand { display: grid; width: 42px; height: 42px; place-items: center; border-radius: var(--radius); background: var(--ink); color: var(--teal-bright); font-weight: 900; text-decoration: none; }
.nav-links { display: flex; align-items: center; gap: 28px; font-size: 0.875rem; font-weight: 700; }
.nav-links a { text-decoration: none; }
.nav-contact { padding: 8px 12px; border: 1px solid var(--ink); border-radius: var(--radius); }
.nav-toggle { display: none; width: 44px; height: 44px; border: 0; background: transparent; }
.nav-toggle span { display: block; width: 22px; height: 2px; margin: 5px auto; background: currentColor; }
.hero { position: relative; min-height: calc(100svh - var(--header-height) - 64px); overflow: hidden; border-bottom: 1px solid var(--rule); }
.hero-content { position: relative; z-index: 2; min-height: inherit; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; padding-block: 80px 72px; }
.hero-name { order: -1; margin: 0 0 20px; font-weight: 850; }
.hero-summary { max-width: 680px; margin: 0; color: var(--ink-soft); font-size: 1.2rem; }
.hero-actions, .social-links, .project-actions, .resume-actions, .contact-actions { display: flex; flex-wrap: wrap; gap: 12px 18px; align-items: center; }
.hero-actions { margin-top: 30px; }
.social-links { margin-top: 24px; font-size: 0.875rem; font-weight: 750; }
.system-map { position: absolute; z-index: 1; top: 30px; right: 3%; width: min(760px, 58vw); aspect-ratio: 16 / 9; opacity: 0.7; pointer-events: none; }
.impact-band { background: var(--surface-dark); color: white; }
.impact-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.impact-grid div { min-height: 150px; display: flex; flex-direction: column; justify-content: center; padding: 28px; border-right: 1px solid var(--rule-light); }
.impact-grid div:first-child { border-left: 1px solid var(--rule-light); }
.impact-grid strong { color: var(--teal-bright); font-size: 2rem; line-height: 1; }
.impact-grid span { margin-top: 10px; color: rgba(255,255,255,0.68); font-size: 0.78rem; text-transform: uppercase; }
.section { padding-block: 112px; border-bottom: 1px solid var(--rule); }
.systems { background: var(--paper); }
.system-list { border-top: 1px solid var(--rule); }
.system-row { display: grid; grid-template-columns: 180px minmax(0, 1fr) 230px; gap: 32px; align-items: start; padding-block: 30px; border-bottom: 1px solid var(--rule); }
.system-row p, .system-row h3 { margin-top: 0; }
.system-row h3 { margin-bottom: 8px; font-size: 1.45rem; }
.system-row > strong { color: var(--teal); text-align: right; }
.system-index { color: var(--ink-soft); font-size: 0.76rem; text-transform: uppercase; }
.system-action { min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--teal); font-weight: 800; cursor: pointer; }
.projects { background: var(--canvas); }
.project-list { display: grid; gap: 24px; margin-bottom: 28px; }
.project { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr); overflow: hidden; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--paper); }
.project-visual { position: relative; min-height: 360px; overflow: hidden; background: var(--surface-dark); }
.project-visual::before, .project-visual::after { content: ""; position: absolute; border: 1px solid rgba(108,225,191,0.4); transform: rotate(28deg); }
.project-visual::before { width: 250px; height: 250px; right: -25px; top: 48px; }
.project-visual::after { width: 130px; height: 130px; right: 150px; top: 110px; border-color: rgba(196,154,47,0.55); transform: rotate(-18deg); }
.project-visual span { position: absolute; left: 30px; bottom: 28px; color: var(--teal-bright); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
.project-copy { display: flex; flex-direction: column; justify-content: center; padding: 42px; }
.project-copy h3 { margin: 8px 0 14px; font-size: 2rem; }
.project-copy > p:not(.eyebrow) { color: var(--ink-soft); }
.project-contribution { padding-top: 16px; border-top: 1px solid var(--rule); }
.technology-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; list-style: none; }
.technology-list li { padding: 5px 8px; border: 1px solid var(--rule); border-radius: 4px; font-size: 0.75rem; }
.project-actions { margin-top: 18px; font-weight: 800; }
.text-link { font-weight: 800; }
.expertise { background: var(--surface-dark); color: white; }
.expertise .eyebrow { color: var(--teal-bright); }
.expertise-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--rule-light); border-left: 1px solid var(--rule-light); }
.expertise-grid article { min-height: 260px; padding: 28px; border-right: 1px solid var(--rule-light); border-bottom: 1px solid var(--rule-light); }
.expertise-grid article > span { color: var(--gold); font-weight: 800; }
.expertise-grid h3 { margin-top: 42px; }
.expertise-grid p { color: rgba(255,255,255,0.65); }
.experience-layout { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 72px; }
.experience-layout .section-heading { display: block; position: sticky; top: calc(var(--header-height) + 40px); align-self: start; }
.timeline { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--rule); }
.timeline li { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: 28px; padding-block: 28px; border-bottom: 1px solid var(--rule); }
.timeline h3, .timeline p { margin: 4px 0; }
.timeline time { color: var(--teal); font-size: 0.78rem; font-weight: 800; }
.timeline li > p { color: var(--ink-soft); }
.resume { background: var(--paper); }
.resume-grid { display: grid; grid-template-columns: repeat(2, 1fr); border-top: 1px solid var(--rule); border-left: 1px solid var(--rule); }
.resume-grid article { min-height: 290px; padding: 34px; border-right: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
.resume-grid article > p:not(.eyebrow) { min-height: 76px; color: var(--ink-soft); }
.contact { padding-block: 90px; background: var(--mint); }
.contact-layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.6fr); gap: 48px; align-items: end; }
.contact-layout h2 { max-width: 720px; margin-bottom: 0; }
.contact-actions { justify-content: flex-end; }
footer { padding-block: 28px; background: var(--ink); color: white; }
footer .content-shell { display: flex; justify-content: space-between; gap: 20px; }
footer p { margin: 0; }
dialog { width: min(760px, calc(100% - 40px)); max-height: calc(100svh - 40px); padding: 0; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--paper); color: var(--ink); }
dialog::backdrop { background: rgba(10, 15, 16, 0.72); }
.dialog-panel { position: relative; padding: 44px; }
.dialog-close { position: sticky; float: right; top: 12px; width: 44px; height: 44px; border: 1px solid var(--rule); border-radius: var(--radius); background: var(--paper); font-size: 1.5rem; cursor: pointer; }
.dialog-metric { color: var(--teal); font-size: 1.2rem; font-weight: 850; }
.dialog-section { padding-top: 22px; border-top: 1px solid var(--rule); }
```

- [ ] **Step 3: Implement mobile and tablet layouts**

Add these breakpoints:

```css
@media (max-width: 900px) {
  h1 { max-width: 720px; font-size: 4rem; }
  .nav-toggle { display: block; cursor: pointer; }
  .nav-links { position: absolute; left: 20px; right: 20px; top: calc(var(--header-height) - 1px); display: none; align-items: stretch; padding: 18px; border: 1px solid var(--rule); background: var(--paper); box-shadow: 0 18px 40px rgba(21,25,27,0.12); }
  .nav-links.is-open { display: grid; }
  .nav-links a { min-height: 44px; display: flex; align-items: center; }
  .system-row { grid-template-columns: 150px minmax(0, 1fr); }
  .system-row > strong { grid-column: 2; text-align: left; }
  .project { grid-template-columns: 1fr; }
  .project-visual { min-height: 280px; }
  .expertise-grid { grid-template-columns: repeat(2, 1fr); }
  .experience-layout { grid-template-columns: 1fr; gap: 40px; }
  .experience-layout .section-heading { position: static; }
  .contact-layout { grid-template-columns: 1fr; }
  .contact-actions { justify-content: flex-start; }
}

@media (max-width: 600px) {
  :root { --header-height: 64px; }
  .content-shell { width: min(100% - 40px, var(--content)); }
  h1 { font-size: 3rem; }
  h2 { font-size: 2rem; }
  .section-heading { grid-template-columns: 1fr; gap: 12px; margin-bottom: 36px; }
  .hero { min-height: calc(100svh - var(--header-height) - 36px); }
  .hero-content { padding-block: 180px 44px; }
  .hero-summary { font-size: 1rem; }
  .hero-actions { align-items: stretch; flex-direction: column; width: 100%; }
  .system-map { top: 16px; left: 5%; right: auto; width: 90%; opacity: 0.38; }
  .impact-grid { grid-template-columns: repeat(2, 1fr); }
  .impact-grid div { min-height: 126px; padding: 20px; }
  .impact-grid div:nth-child(odd) { border-left: 1px solid var(--rule-light); }
  .section { padding-block: 76px; }
  .system-row { grid-template-columns: 1fr; gap: 8px; }
  .system-row > strong { grid-column: auto; }
  .project-copy { padding: 26px 22px; }
  .expertise-grid, .resume-grid { grid-template-columns: 1fr; }
  .expertise-grid article { min-height: 220px; }
  .timeline li { grid-template-columns: 1fr; gap: 12px; }
  .resume-grid article > p:not(.eyebrow) { min-height: 0; }
  .contact { padding-block: 68px; }
  .contact-actions { align-items: flex-start; flex-direction: column; }
  footer .content-shell { align-items: flex-start; flex-direction: column; }
  dialog { width: calc(100% - 24px); max-height: calc(100svh - 24px); }
  .dialog-panel { padding: 28px 22px; }
}
```

- [ ] **Step 4: Implement interaction and motion states in CSS**

Add the final states and motion policy:

```css
.site-header.is-scrolled { border-bottom-color: var(--rule); }
.system-row, .project, .button, .project-actions a { transition: transform 180ms ease, background-color 180ms ease, color 180ms ease; }
.system-row:hover { background: color-mix(in srgb, var(--mint) 42%, transparent); }
.button:hover, .project-actions a:hover { transform: translateY(-2px); }
[data-reveal] { opacity: 0; transform: translateY(16px); transition: opacity 500ms ease, transform 500ms ease; }
[data-reveal].is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.001ms !important; animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
  [data-reveal] { opacity: 1; transform: none; }
}
```

- [ ] **Step 5: Run DOM and content tests**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: content and DOM tests pass.

- [ ] **Step 6: Commit the visual system**

```bash
git add index.html assets/css/styles.css
git commit -m "Add executive editorial portfolio styling"
```

### Task 4: Render Curated Personal Projects

**Files:**
- Create: `assets/js/render-projects.js`
- Create: `tests/render-projects.test.mjs`
- Modify: `index.html`

- [ ] **Step 1: Write failing rendering tests**

Create `tests/render-projects.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { renderProject, renderProjects } from "../assets/js/render-projects.js";

const project = {
  id: "project-one",
  title: "Project One",
  category: "AI tool",
  summary: "A useful project with enough detail to explain its purpose.",
  contribution: "Designed and implemented the complete project.",
  stack: ["JavaScript", "Python"],
  status: "Active",
  sourceUrl: "https://github.com/debi-p/project-one",
  liveUrl: "",
  original: true,
  ready: true,
  featured: true
};

test("renders source link and hides an absent live link", () => {
  const html = renderProject(project);
  assert.match(html, /View source/);
  assert.doesNotMatch(html, /Live demo/);
});

test("renders a live action only when supplied", () => {
  const html = renderProject({ ...project, liveUrl: "https://example.com" });
  assert.match(html, /Live demo/);
});

test("filters unready projects and produces one featured project", () => {
  const html = renderProjects([project, { ...project, id: "hidden", ready: false }]);
  assert.equal((html.match(/data-project=/g) || []).length, 1);
  assert.match(html, /project--featured/);
});
```

- [ ] **Step 2: Run tests to verify the renderer is missing**

Run: `node --test tests/render-projects.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure rendering module**

Create `assets/js/render-projects.js` with:

```js
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export function renderProject(project) {
  const liveAction = project.liveUrl
    ? `<a href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noreferrer">Live demo <span aria-hidden="true">↗</span></a>`
    : "";
  const stack = project.stack.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `
    <article class="project ${project.featured ? "project--featured" : ""}" data-project="${escapeHtml(project.id)}" data-reveal>
      <div class="project-visual" aria-hidden="true"><span>${escapeHtml(project.category)}</span></div>
      <div class="project-copy">
        <p class="eyebrow">${escapeHtml(project.status)}</p>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.summary)}</p>
        <p class="project-contribution">${escapeHtml(project.contribution)}</p>
        <ul class="technology-list" aria-label="Technology stack">${stack}</ul>
        <div class="project-actions">
          ${liveAction}
          <a href="${escapeHtml(project.sourceUrl)}" target="_blank" rel="noreferrer">View source <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </article>`;
}

export function renderProjects(projects) {
  return projects.filter(({ ready, original }) => ready && original).map(renderProject).join("");
}
```

- [ ] **Step 4: Add the project mount and no-JavaScript fallback**

In `index.html`, the projects section must contain:

```html
<div id="project-list" class="project-list" aria-live="polite">
  <noscript>
    <article class="project project--featured">
      <div class="project-copy">
        <p class="eyebrow">Active build</p>
        <h3>Brainy Blocks</h3>
        <p>A browser-based collection of coding, logic, language, and visual activities designed for young learners.</p>
        <a href="https://github.com/debi-p/kids-puzzle">View source</a>
      </div>
    </article>
  </noscript>
</div>
```

- [ ] **Step 5: Run renderer and full unit tests**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: all content, DOM, and rendering tests pass.

- [ ] **Step 6: Commit project rendering**

```bash
git add index.html assets/js/render-projects.js tests/render-projects.test.mjs
git commit -m "Render curated personal projects"
```

### Task 5: Add Navigation, Dialogs, and Progressive Enhancement

**Files:**
- Create: `assets/js/main.js`
- Modify: `index.html`
- Modify: `tests/dom.test.mjs`

- [ ] **Step 1: Extend the DOM contract for progressive controls**

Append to `tests/dom.test.mjs`:

```js
test("connects every case-study control to public content", async () => {
  const { caseStudies } = await import("../assets/js/content.js");
  const ids = new Set(caseStudies.map(({ id }) => id));
  const controls = [...html.matchAll(/<button[^>]+data-case-study="([^"]+)"[^>]*>/g)].map((match) => match[1]);
  assert.equal(controls.length, 4);
  for (const id of controls) assert.ok(ids.has(id));
});

test("keeps resume and social actions explicit", () => {
  has(/<a[^>]+href="assets\/resume\/Debi_Prasad\.pdf"[^>]*>/);
  has(/<a[^>]+href="assets\/resume\/debi_prasad_resume\.pdf"[^>]*>/);
  has(/<a[^>]+href="https:\/\/github\.com\/debi-p"[^>]*>/);
  has(/<a[^>]+href="https:\/\/www\.linkedin\.com\/in\/debiprasadpradhan"[^>]*>/);
});
```

- [ ] **Step 2: Run DOM tests to verify case controls and resume links fail if absent**

Run:

```bash
node --test tests/dom.test.mjs
```

Expected: FAIL until the controls and exact links exist.

- [ ] **Step 3: Add exact system controls and resume links to HTML**

Append one matching button to the content column of each system row:

```html
<button class="system-action" type="button" data-case-study="specflow-ai" aria-haspopup="dialog">
  Inspect the system <span aria-hidden="true">→</span>
</button>
<button class="system-action" type="button" data-case-study="scilens" aria-haspopup="dialog">
  Inspect the system <span aria-hidden="true">→</span>
</button>
<button class="system-action" type="button" data-case-study="evidencegraph" aria-haspopup="dialog">
  Inspect the system <span aria-hidden="true">→</span>
</button>
<button class="system-action" type="button" data-case-study="releasegrid" aria-haspopup="dialog">
  Inspect the system <span aria-hidden="true">→</span>
</button>
```

Keep both exact resume paths and exact GitHub/LinkedIn profile links introduced in Task 2.

- [ ] **Step 4: Implement `assets/js/main.js`**

Create `assets/js/main.js` with these focused functions:

```js
import { caseStudies, personalProjects } from "./content.js";
import { renderProjects } from "./render-projects.js";
import { initSystemMap } from "./system-map.js";

const byId = new Map(caseStudies.map((study) => [study.id, study]));

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function renderList(selector, items) {
  const list = document.querySelector(selector);
  if (!list) return;
  list.replaceChildren(...items.map((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    return listItem;
  }));
}

function initProjects() {
  const mount = document.querySelector("#project-list");
  if (mount) mount.innerHTML = renderProjects(personalProjects);
}

function initNavigation() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#site-navigation");
  if (!header || !toggle || !links) return;

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    links.classList.remove("is-open");
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    links.classList.toggle("is-open", open);
  });
  links.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));

  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initCaseStudyDialog() {
  const dialog = document.querySelector("#case-study-dialog");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const closeButton = dialog.querySelector(".dialog-close");
  let trigger = null;

  const open = (button) => {
    const study = byId.get(button.dataset.caseStudy);
    if (!study) return;
    trigger = button;
    setText("#case-study-category", study.category);
    setText("#case-study-title", study.name);
    setText("#case-study-metric", study.metric);
    setText("#case-study-problem", study.problem);
    setText("#case-study-role", study.role);
    renderList("#case-study-approach", study.approach);
    renderList("#case-study-outcomes", study.outcomes);
    renderList("#case-study-technologies", study.technologies);
    dialog.showModal();
  };

  document.querySelectorAll("[data-case-study]").forEach((button) => {
    button.addEventListener("click", () => open(button));
  });
  closeButton?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => trigger?.focus());
}

function initReveals() {
  const elements = [...document.querySelectorAll("[data-reveal]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.18 });
  elements.forEach((element) => observer.observe(element));
}

function initFooterYear() {
  setText("[data-current-year]", new Date().getFullYear());
}

initProjects();
initNavigation();
initCaseStudyDialog();
initReveals();
initFooterYear();

const canvas = document.querySelector("#system-map");
if (canvas) initSystemMap(canvas);
```

- [ ] **Step 5: Run unit and DOM tests**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: all tests pass except the system-map test introduced next.

- [ ] **Step 6: Commit interactions**

```bash
git add index.html assets/js/main.js tests/dom.test.mjs
git commit -m "Add accessible portfolio interactions"
```

### Task 6: Implement the Hero System Map

**Files:**
- Create: `assets/js/system-map.js`
- Create: `tests/system-map.test.mjs`
- Modify: `index.html`
- Modify: `assets/css/styles.css`

- [ ] **Step 1: Write failing lifecycle tests**

Create `tests/system-map.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { shouldAnimate, buildSystemNodes } from "../assets/js/system-map.js";

test("disables continuous animation for reduced motion", () => {
  assert.equal(shouldAnimate({ reducedMotion: true, visible: true }), false);
  assert.equal(shouldAnimate({ reducedMotion: false, visible: false }), false);
  assert.equal(shouldAnimate({ reducedMotion: false, visible: true }), true);
});

test("builds deterministic normalized system nodes", () => {
  const nodes = buildSystemNodes();
  assert.ok(nodes.length >= 8);
  for (const node of nodes) {
    assert.ok(node.x >= 0 && node.x <= 1);
    assert.ok(node.y >= 0 && node.y <= 1);
    assert.ok(["ai", "platform", "data", "human"].includes(node.kind));
  }
});
```

- [ ] **Step 2: Run tests to verify the module is missing**

Run: `node --test tests/system-map.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement deterministic canvas data and lifecycle**

Create `assets/js/system-map.js` exporting:

```js
export function shouldAnimate({ reducedMotion, visible }) {
  return !reducedMotion && visible;
}

export function buildSystemNodes() {
  return [
    { x: 0.08, y: 0.62, kind: "human", label: "Intent" },
    { x: 0.23, y: 0.35, kind: "ai", label: "Reason" },
    { x: 0.41, y: 0.57, kind: "platform", label: "Orchestrate" },
    { x: 0.57, y: 0.27, kind: "data", label: "Evidence" },
    { x: 0.72, y: 0.52, kind: "platform", label: "Govern" },
    { x: 0.88, y: 0.31, kind: "ai", label: "Evaluate" },
    { x: 0.66, y: 0.78, kind: "human", label: "Review" },
    { x: 0.34, y: 0.82, kind: "data", label: "Observe" }
  ];
}
```

Complete `assets/js/system-map.js` with this renderer after the two pure exports above:

```js
const connections = [[0, 1], [1, 2], [1, 3], [2, 3], [2, 6], [2, 7], [3, 4], [3, 5], [4, 5], [4, 6], [6, 7]];
const colors = {
  line: "rgba(8, 112, 94, 0.26)",
  ai: "#08705e",
  platform: "#15191b",
  data: "#c49a2f",
  human: "#59635f",
  label: "rgba(21, 25, 27, 0.68)"
};

export function initSystemMap(canvas) {
  const context = canvas.getContext?.("2d");
  if (!context) return () => {};

  const hero = canvas.closest(".hero") || canvas;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const nodes = buildSystemNodes();
  let reducedMotion = motionQuery.matches;
  let visible = true;
  let frame = 0;
  let width = 1;
  let height = 1;
  let pointerX = 0;
  let pointerY = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  };

  const point = (node) => ({
    x: node.x * width + pointerX * (node.x - 0.5) * 8,
    y: node.y * height + pointerY * (node.y - 0.5) * 8
  });

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.strokeStyle = colors.line;
    for (const [fromIndex, toIndex] of connections) {
      const from = point(nodes[fromIndex]);
      const to = point(nodes[toIndex]);
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }

    nodes.forEach((node, index) => {
      const position = point(node);
      const pulse = reducedMotion ? 0 : Math.sin(time / 900 + index) * 1.5;
      context.beginPath();
      context.fillStyle = colors[node.kind];
      context.arc(position.x, position.y, 4.5 + pulse, 0, Math.PI * 2);
      context.fill();
      context.font = "600 11px Arial, sans-serif";
      context.fillStyle = colors.label;
      context.fillText(node.label, position.x + 10, position.y - 9);
    });
  };

  const tick = (time) => {
    draw(time);
    frame = shouldAnimate({ reducedMotion, visible }) ? requestAnimationFrame(tick) : 0;
  };

  const syncAnimation = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (shouldAnimate({ reducedMotion, visible })) frame = requestAnimationFrame(tick);
    else draw(performance.now());
  };

  const onPointerMove = (event) => {
    const rect = hero.getBoundingClientRect();
    pointerX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
  };

  const onMotionChange = (event) => {
    reducedMotion = event.matches;
    syncAnimation();
  };

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncAnimation();
  }, { threshold: 0.01 });
  visibilityObserver.observe(hero);

  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  if (resizeObserver) resizeObserver.observe(canvas);
  else window.addEventListener("resize", resize);
  hero.addEventListener("pointermove", onPointerMove, { passive: true });
  motionQuery.addEventListener?.("change", onMotionChange);

  resize();
  syncAnimation();

  return () => {
    if (frame) cancelAnimationFrame(frame);
    visibilityObserver.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener("resize", resize);
    hero.removeEventListener("pointermove", onPointerMove);
    motionQuery.removeEventListener?.("change", onMotionChange);
  };
}
```

- [ ] **Step 4: Add canvas markup and stable CSS dimensions**

Place inside the hero:

```html
<canvas id="system-map" class="system-map" aria-hidden="true"></canvas>
```

Give `.system-map` absolute positioning, `width: min(760px, 58vw)`, a stable `aspect-ratio: 16 / 9`, controlled opacity, and `pointer-events: none`. On mobile, reposition it above the copy with reduced opacity so it cannot cover text.

- [ ] **Step 5: Run all unit tests**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: all tests pass.

- [ ] **Step 6: Commit the system map**

```bash
git add index.html assets/css/styles.css assets/js/system-map.js tests/system-map.test.mjs
git commit -m "Add responsive hero system map"
```

### Task 7: Add Resumes, Identity Assets, and Documentation

**Files:**
- Create: `assets/resume/Debi_Prasad.pdf`
- Create: `assets/resume/debi_prasad_resume.pdf`
- Create: `assets/images/favicon.svg`
- Create: `assets/images/social-preview.png`
- Create: `scripts/capture-social-preview.mjs`
- Create: `tests/helpers/playwright.mjs`
- Replace: `README.md`

- [ ] **Step 1: Copy the two approved resume binaries**

Run:

```bash
mkdir -p assets/resume
cp /Users/debi.pradhan/Documents/Resume/Debi_Prasad.pdf assets/resume/Debi_Prasad.pdf
cp /Users/debi.pradhan/Documents/Resume/debi_prasad_resume.pdf assets/resume/debi_prasad_resume.pdf
```

Expected: both files exist and are non-empty.

- [ ] **Step 2: Verify the resume files are readable PDFs**

Run:

```bash
file assets/resume/*.pdf
```

Expected: both results identify `PDF document`.

- [ ] **Step 3: Create the DP favicon**

Create `assets/images/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="DP">
  <rect width="64" height="64" rx="8" fill="#15191b"/>
  <path d="M14 16h15c12 0 19 6 19 16s-7 16-19 16H14V16Zm10 9v14h5c6 0 9-2 9-7s-3-7-9-7h-5Z" fill="#6ce1bf"/>
</svg>
```

- [ ] **Step 4: Generate the social preview from HTML using Playwright**

Create `tests/helpers/playwright.mjs`:

```js
export async function loadPlaywright() {
  const specifier = process.env.PLAYWRIGHT_MODULE_PATH || "playwright";
  return import(specifier);
}
```

Create `scripts/capture-social-preview.mjs`:

```js
import { mkdir } from "node:fs/promises";
import { loadPlaywright } from "../tests/helpers/playwright.mjs";

await mkdir("assets/images", { recursive: true });
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewportSize: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.addStyleTag({ content: `
    .site-header, .impact-band { display: none !important; }
    .hero { min-height: 630px !important; }
    .hero-content { padding-top: 44px !important; padding-bottom: 44px !important; }
  ` });
  await page.waitForTimeout(250);
  await page.screenshot({
    path: "assets/images/social-preview.png",
    clip: { x: 0, y: 0, width: 1200, height: 630 }
  });
} finally {
  await browser.close();
}
```

Start a static server in a persistent terminal session:

```bash
python3 -m http.server 4173
```

Expected: the server listens on `http://127.0.0.1:4173/` and remains running while the capture runs.

Run the capture in a second terminal command, resolving the bundled runtime through an environment variable that is not committed to the repository:

```bash
PLAYWRIGHT_MODULE_PATH=file:///Users/debi.pradhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node scripts/capture-social-preview.mjs
```

Expected: `assets/images/social-preview.png` is a 1200x630 PNG with non-uniform pixels.

- [ ] **Step 5: Replace README with local and deployment instructions**

Replace `README.md` with:

````markdown
# Debi Prasad Portfolio

Static HTML, CSS, and JavaScript portfolio deployed at https://debi-p.github.io/.

## Preview

```bash
npm install
python3 -m http.server 4173
```

Open http://localhost:4173/.

## Verify

```bash
npm test
npm run check:links
```

## Add a project

Add a public-safe record to `assets/js/content.js`. Projects appear only when both `original` and `ready` are `true`. Leave `liveUrl` empty to hide the live-demo action.
````

- [ ] **Step 6: Run the link checker and all unit tests**

Run:

```bash
npm test
npm run check:links
```

Expected: all tests pass and all local links exist.

- [ ] **Step 7: Commit assets and documentation**

```bash
git add assets/resume assets/images README.md scripts/capture-social-preview.mjs tests/helpers/playwright.mjs
git commit -m "Add portfolio resumes and identity assets"
```

### Task 8: Browser Verification and Polish

**Files:**
- Create: `tests/visual.spec.mjs`
- Modify: `.gitignore`
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Modify: `assets/js/main.js`
- Modify: `assets/js/system-map.js`

- [ ] **Step 1: Write the browser verification script**

Add `artifacts/` to `.gitignore`; screenshots are QA evidence and must not be published with the site.

Create `tests/visual.spec.mjs` using bundled Playwright:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { loadPlaywright } from "./helpers/playwright.mjs";

const baseUrl = "http://127.0.0.1:4173";

async function withPage(viewport, callback) {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewportSize: viewport });
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await callback(page);
  } finally {
    await browser.close();
  }
}

test("desktop experience renders key content and working dialog", async () => {
  await withPage({ width: 1440, height: 1000 }, async (page) => {
    await page.screenshot({ path: "artifacts/portfolio-desktop.png", fullPage: true });
    assert.match(await page.locator("h1").innerText(), /survive the real world/i);
    assert.equal(await page.locator("[data-case-study]").count(), 4);
    await page.locator('[data-case-study="releasegrid"]').click();
    await page.locator("#case-study-dialog").waitFor({ state: "visible" });
    assert.match(await page.locator("#case-study-dialog").innerText(), /400 GB/);
  });
});

test("mobile navigation, project links, and layout stay usable", async () => {
  await withPage({ width: 390, height: 844 }, async (page) => {
    await page.locator(".nav-toggle").click();
    assert.equal(await page.locator(".nav-toggle").getAttribute("aria-expanded"), "true");
    await page.screenshot({ path: "artifacts/portfolio-mobile.png", fullPage: true });
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(horizontalOverflow, false);
    assert.equal(await page.locator('[data-project="brainy-blocks"] a').count() >= 1, true);
  });
});

test("canvas contains rendered non-background pixels", async () => {
  await withPage({ width: 1440, height: 900 }, async (page) => {
    const changedPixels = await page.locator("#system-map").evaluate((canvas) => {
      const context = canvas.getContext("2d");
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonTransparent = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonTransparent += 1;
      return nonTransparent;
    });
    assert.ok(changedPixels > 100);
  });
});
```

- [ ] **Step 2: Start the local static server**

Run: `python3 -m http.server 4173`

Expected: server listens at `http://127.0.0.1:4173/` and remains running for the following checks.

- [ ] **Step 3: Run visual tests and confirm initial failures accurately identify issues**

Run:

```bash
mkdir -p artifacts
PLAYWRIGHT_MODULE_PATH=file:///Users/debi.pradhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node --test tests/visual.spec.mjs
```

Expected: tests pass or expose specific behavior/layout issues to fix. Do not weaken assertions to hide defects.

- [ ] **Step 4: Inspect desktop and mobile screenshots**

Open:

- `artifacts/portfolio-desktop.png`
- `artifacts/portfolio-mobile.png`

Check hero framing, section rhythm, system-row alignment, dialog framing, project visuals, timeline readability, resume controls, contact close, and footer. Verify no text overlap, clipping, accidental one-color dominance, or empty canvas.

- [ ] **Step 5: Fix every observed behavior and layout defect**

Use this deterministic defect routing:

- horizontal overflow or text clipping: fix the responsible grid track, width, or wrapping rule in `assets/css/styles.css`;
- inaccessible mobile navigation or dialog focus: fix event and ARIA state handling in `assets/js/main.js` and the matching HTML control;
- blank, oversized, or obscuring system map: fix canvas dimensions or lifecycle handling in `assets/js/system-map.js` and `.system-map` CSS;
- missing content or incorrect link: fix `index.html` or `assets/js/content.js`, then rerun the public-content safety test;
- low contrast or unclear focus: update the relevant token or focused selector in `assets/css/styles.css` while retaining the approved palette.

After each correction, rerun the failing browser test before advancing. Preserve the approved copy, 400 GB qualification, project curation, and public-safety contract.

- [ ] **Step 6: Run the complete verification suite**

Run:

```bash
npm test
npm run check:links
PLAYWRIGHT_MODULE_PATH=file:///Users/debi.pradhan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node --test tests/visual.spec.mjs
git diff --check
git status --short
```

Expected: all unit tests pass, all local links exist, all browser tests pass, no whitespace errors, and only intended files are modified or untracked.

- [ ] **Step 7: Commit the verified first version**

```bash
git add .gitignore index.html assets tests package.json README.md scripts
git commit -m "Build verified portfolio first version"
```

### Task 9: Final Branch Review and Handoff

**Files:**
- Review only: all changed files

- [ ] **Step 1: Inspect the final branch diff and commit history**

Run:

```bash
git status --short --branch
git log --oneline --decorate main..HEAD
git diff --stat main...HEAD
git diff --check main...HEAD
```

Expected: clean branch, focused portfolio commits, no whitespace errors.

- [ ] **Step 2: Re-run public-content safety checks**

Run:

```bash
node --test tests/content.test.mjs
rg -n -i "thermofisher\.atlassian\.net|confluence|jira|revenera|flexera|workflow forge|pywizard|signed url|bucket" index.html assets README.md
```

Expected: content tests pass; `rg` returns no matches in public site files.

- [ ] **Step 3: Use the code-review workflow**

Invoke `superpowers:requesting-code-review` and address any correctness, confidentiality, accessibility, or responsive-layout findings before integration.

- [ ] **Step 4: Use the verification-before-completion workflow**

Invoke `superpowers:verification-before-completion` and rerun the exact final commands it requires before claiming the portfolio is complete.

- [ ] **Step 5: Present branch integration options**

Invoke `superpowers:finishing-a-development-branch` to choose whether to merge locally, push and open a pull request, retain the branch, or discard it. Do not push to GitHub without the user's explicit confirmation at this final integration step.
